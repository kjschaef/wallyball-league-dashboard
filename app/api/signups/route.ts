import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { format } from 'date-fns';
import {
  DEFAULT_SIGNUP_SETTINGS,
  getEasternWallTimeNow,
  getSignupCycleState,
  isDateInSignupWeek,
  parseAvailableDays,
  type SignupSettings,
} from '../../lib/signups';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SignupSettingsRow = {
  signup_open_day_of_week: number | null;
  signup_open_time: string | null;
  signup_close_day_of_week: number | null;
  signup_close_time: string | null;
  available_days: string | null;
};

const WEEKLY_UNAVAILABLE_MIGRATION_ERROR =
  'Weekly unavailable signups are unavailable until the latest database migrations are applied';

function isMissingWeeklyUnavailableTable(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const pgError = error as { code?: string; message?: string };
  return pgError.code === '42P01' && (pgError.message ?? '').includes('weekly_unavailable');
}

function buildSignupSettings(settingsRows: SignupSettingsRow[]): SignupSettings {
  return settingsRows.length > 0
    ? {
        signupOpenDayOfWeek: settingsRows[0].signup_open_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupOpenDayOfWeek,
        signupOpenTime: settingsRows[0].signup_open_time ?? DEFAULT_SIGNUP_SETTINGS.signupOpenTime,
        signupCloseDayOfWeek: settingsRows[0].signup_close_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupCloseDayOfWeek,
        signupCloseTime: settingsRows[0].signup_close_time ?? DEFAULT_SIGNUP_SETTINGS.signupCloseTime,
        availableDays: parseAvailableDays(settingsRows[0].available_days),
      }
    : DEFAULT_SIGNUP_SETTINGS;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const playerParam = url.searchParams.get('playerId');
    const unavailableParam = url.searchParams.get('unavailable');

    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    if (unavailableParam === '1') {
      const settings = await sql`
        SELECT signup_open_day_of_week, signup_open_time, signup_close_day_of_week, signup_close_time, available_days
        FROM site_settings
        LIMIT 1
      ` as SignupSettingsRow[];
      const signupSettings = buildSignupSettings(settings);
      const signupState = getSignupCycleState(getEasternWallTimeNow(), signupSettings);

      if (!signupState.isOpen || !signupState.signupWeekSunday) {
        return NextResponse.json([]);
      }

      const weekStart = format(signupState.signupWeekSunday, 'yyyy-MM-dd');
      let unavailablePlayers;
      try {
        unavailablePlayers = await sql`
          SELECT
            wu.id,
            wu.player_id,
            wu.week_start::text AS week_start,
            wu.created_at,
            p.name
          FROM weekly_unavailable wu
          JOIN players p ON wu.player_id = p.id
          WHERE wu.week_start = ${weekStart}
          ORDER BY wu.created_at ASC
        `;
      } catch (error) {
        if (isMissingWeeklyUnavailableTable(error)) {
          console.warn(WEEKLY_UNAVAILABLE_MIGRATION_ERROR, error);
          return NextResponse.json([]);
        }

        throw error;
      }

      return NextResponse.json(unavailablePlayers);
    }

    let signups;
    if (dateParam) {
      signups = await sql`
        SELECT s.*, p.name
        FROM weekly_signups s
        JOIN players p ON s.player_id = p.id
        WHERE s.date = ${dateParam}
        ORDER BY s.created_at ASC
      `;
    } else if (playerParam) {
      signups = await sql`
        SELECT s.*, p.name
        FROM weekly_signups s
        JOIN players p ON s.player_id = p.id
        WHERE s.player_id = ${playerParam} AND s.date::date >= current_date
        ORDER BY s.date ASC
      `;
    } else {
      signups = await sql`
        SELECT s.*, p.name
        FROM weekly_signups s
        JOIN players p ON s.player_id = p.id
        WHERE s.date::date >= current_date - interval '7 days'
        ORDER BY s.date ASC, s.created_at ASC
      `;
    }

    return NextResponse.json(signups);
  } catch (error) {
    console.error('Error fetching signups:', error);
    return NextResponse.json({ error: 'Failed to fetch signups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, date, unavailable } = body;

    if (!playerId || (!date && !unavailable)) {
      return NextResponse.json({ error: 'playerId and date are required' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    const settings = await sql`
      SELECT signup_open_day_of_week, signup_open_time, signup_close_day_of_week, signup_close_time, available_days
      FROM site_settings
      LIMIT 1
    ` as SignupSettingsRow[];
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_token')?.value === 'true';
    const signupSettings = buildSignupSettings(settings);
    const signupState = getSignupCycleState(getEasternWallTimeNow(), signupSettings);

    if (unavailable) {
      if (!isAdmin && (!signupState.isOpen || !signupState.signupWeekSunday)) {
        return NextResponse.json({ error: 'Signups are closed for this week' }, { status: 403 });
      }

      const weekStart = body.weekStart && isAdmin
        ? body.weekStart
        : format(signupState.signupWeekSunday ?? getEasternWallTimeNow(), 'yyyy-MM-dd');

      let existingUnavailable;
      let unavailableRow;
      try {
        existingUnavailable = await sql`
          SELECT id FROM weekly_unavailable
          WHERE player_id = ${playerId} AND week_start = ${weekStart}
        `;
        if (existingUnavailable.length > 0) {
          return NextResponse.json({ error: 'Player is already marked unavailable for this week' }, { status: 400 });
        }

        unavailableRow = await sql`
          INSERT INTO weekly_unavailable (player_id, week_start)
          VALUES (${playerId}, ${weekStart})
          RETURNING id, player_id, week_start::text AS week_start, created_at
        `;
      } catch (error) {
        if (isMissingWeeklyUnavailableTable(error)) {
          console.error(WEEKLY_UNAVAILABLE_MIGRATION_ERROR, error);
          return NextResponse.json({ error: WEEKLY_UNAVAILABLE_MIGRATION_ERROR }, { status: 503 });
        }

        throw error;
      }

      return NextResponse.json({ success: true, unavailable: unavailableRow[0] });
    }

    if (!isAdmin) {
      if (!signupState.isOpen || !isDateInSignupWeek(date, signupState.signupWeekSunday, signupSettings.availableDays)) {
        return NextResponse.json({ error: 'Signups are closed for this date' }, { status: 403 });
      }
    }

    const existing = await sql`SELECT id FROM weekly_signups WHERE player_id = ${playerId} AND date = ${date}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Player already signed up for this date' }, { status: 400 });
    }

    const countRes = await sql`SELECT count(*) as total FROM weekly_signups WHERE date = ${date} AND status = 'registered'`;
    const count = parseInt(countRes[0].total, 10);
    const status = count < 6 ? 'registered' : 'waitlisted';

    const newSignup = await sql`
      INSERT INTO weekly_signups (player_id, date, status)
      VALUES (${playerId}, ${date}, ${status})
      RETURNING *
    `;

    return NextResponse.json({ success: true, signup: newSignup[0] });
  } catch (error) {
    console.error('Error creating signup:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, playerId, date, unavailable, weekStart } = body;

    if (unavailable) {
      if (!id && !(playerId && weekStart)) {
        return NextResponse.json({ error: 'id or (playerId and weekStart) required for unavailable removal' }, { status: 400 });
      }

      if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
      const sql = neon(process.env.DATABASE_URL);

      try {
        if (id) {
          await sql`DELETE FROM weekly_unavailable WHERE id = ${id}`;
        } else {
          await sql`DELETE FROM weekly_unavailable WHERE player_id = ${playerId} AND week_start = ${weekStart}`;
        }
      } catch (error) {
        if (isMissingWeeklyUnavailableTable(error)) {
          console.error(WEEKLY_UNAVAILABLE_MIGRATION_ERROR, error);
          return NextResponse.json({ error: WEEKLY_UNAVAILABLE_MIGRATION_ERROR }, { status: 503 });
        }

        throw error;
      }

      return NextResponse.json({ success: true });
    }

    if (!id && !(playerId && date)) {
      return NextResponse.json({ error: 'id or (playerId and date) required' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    let targetSignup;
    if (id) {
      targetSignup = await sql`SELECT * FROM weekly_signups WHERE id = ${id}`;
    } else {
      targetSignup = await sql`SELECT * FROM weekly_signups WHERE player_id = ${playerId} AND date = ${date}`;
    }

    if (targetSignup.length === 0) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    const { id: signupId, date: signupDate, status } = targetSignup[0];

    await sql`DELETE FROM weekly_signups WHERE id = ${signupId}`;

    if (status === 'registered') {
      const waitlisted = await sql`
        SELECT id FROM weekly_signups
        WHERE date = ${signupDate} AND status = 'waitlisted'
        ORDER BY created_at ASC
        LIMIT 1
      `;

      if (waitlisted.length > 0) {
        await sql`
          UPDATE weekly_signups
          SET status = 'registered'
          WHERE id = ${waitlisted[0].id}
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting signup:', error);
    return NextResponse.json({ error: 'Failed to delete signup' }, { status: 500 });
  }
}
