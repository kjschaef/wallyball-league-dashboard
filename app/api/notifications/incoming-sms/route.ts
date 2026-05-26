import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { format } from 'date-fns';
import {
  DEFAULT_SIGNUP_SETTINGS,
  getEasternWallTimeNow,
  getSignupCycleState,
  generateWeekDates,
  parseAvailableDays,
  type SignupSettings,
} from '../../../lib/signups';
import { parseSmsResponse } from '../../../lib/twilio';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SignupSettingsRow = {
  signup_open_day_of_week: number | null;
  signup_open_time: string | null;
  signup_close_day_of_week: number | null;
  signup_close_time: string | null;
  available_days: string | null;
};

function buildSignupSettings(settingsRows: SignupSettingsRow[]): SignupSettings {
  return settingsRows.length > 0
    ? {
        signupOpenDayOfWeek: settingsRows[0].signup_open_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupOpenDayOfWeek,
        signupOpenTime: settingsRows[0].signup_open_time ?? DEFAULT_SIGNUP_SETTINGS.signupOpenTime,
        signupCloseDayOfWeek: settingsRows[0].signup_close_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupCloseDayOfWeek,
        signupCloseTime: settingsRows[0].signup_close_time ?? DEFAULT_SIGNUP_SETTINGS.signupCloseTime,
        availableDays: parseAvailableDays(settingsRows[0].available_days),
        smsRemindersEnabled: false,
        smsRemindersDayOfWeek: 3,
        smsRemindersTime: '12:00',
      }
    : DEFAULT_SIGNUP_SETTINGS;
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    const sql = neon(process.env.DATABASE_URL);

    // 1. Parse Twilio Form Data
    const formData = await request.formData();
    const fromPhone = (formData.get('From') as string) || '';
    const messageBody = (formData.get('Body') as string) || '';

    if (!fromPhone || !messageBody) {
      return new NextResponse(
        `<Response><Message>Error: Missing sender or message body.</Message></Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    // 2. Identify Player by Phone Number (Last 10 digits match)
    const cleanFrom = fromPhone.replace(/\D/g, '');
    const last10 = cleanFrom.slice(-10);

    const matchedPlayers = await sql`
      SELECT id, name FROM players 
      WHERE phone_number = ${fromPhone} 
         OR phone_number = ${cleanFrom}
         OR (
           phone_number IS NOT NULL 
           AND phone_number != ''
           AND RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 10) = ${last10}
         )
      LIMIT 1
    ` as { id: number; name: string }[];

    if (matchedPlayers.length === 0) {
      return new NextResponse(
        `<Response><Message>Wallyball League: We couldn't find a player registered with this number. Please check with your admin.</Message></Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    const player = matchedPlayers[0];

    // 3. Fetch Settings & Active Cycle
    const settings = await sql`
      SELECT signup_open_day_of_week, signup_open_time, signup_close_day_of_week, signup_close_time, available_days
      FROM site_settings
      LIMIT 1
    ` as SignupSettingsRow[];
    
    const signupSettings = buildSignupSettings(settings);
    const signupState = getSignupCycleState(getEasternWallTimeNow(), signupSettings);

    if (!signupState.isOpen || !signupState.signupWeekSunday) {
      return new NextResponse(
        `<Response><Message>Wallyball League: Signups are currently closed. No active games found.</Message></Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    const weekStart = format(signupState.signupWeekSunday, 'yyyy-MM-dd');
    const openDates = generateWeekDates(signupState.signupWeekSunday, signupSettings.availableDays);

    if (openDates.length === 0) {
      return new NextResponse(
        `<Response><Message>Wallyball League: No game days scheduled for this week.</Message></Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    // 4. Parse Response Body
    const rsvp = parseSmsResponse(messageBody, openDates.length);
    if (!rsvp) {
      const host = request.headers.get('host') || 'wallyball.app';
      return new NextResponse(
        `<Response><Message>Wallyball League: Sorry, we couldn't parse that. Please reply with numbers (e.g. '1 2' for Tue/Thu) or 'NONE'. Or update manually at https://${host}/signups</Message></Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    const { rsvpIn, rsvpOut } = rsvp;

    // 5. Update database & handle waitlist/promotions
    // If they marked NONE (empty rsvpIn), insert into weekly_unavailable
    if (rsvpIn.length === 0) {
      // Check if already in weekly_unavailable
      const existing = await sql`
        SELECT id FROM weekly_unavailable WHERE player_id = ${player.id} AND week_start = ${weekStart}
      `;
      if (existing.length === 0) {
        await sql`
          INSERT INTO weekly_unavailable (player_id, week_start)
          VALUES (${player.id}, ${weekStart})
        `;
      }
    } else {
      // Remove any weekly_unavailable entry since they're playing at least one day
      await sql`
        DELETE FROM weekly_unavailable WHERE player_id = ${player.id} AND week_start = ${weekStart}
      `;
    }

    // Process RSVP out days (cancellations)
    for (const outIndex of rsvpOut) {
      const date = openDates[outIndex];
      
      // Look up if they had a signup
      const existingSignup = await sql`
        SELECT id, status FROM weekly_signups WHERE player_id = ${player.id} AND date = ${date}
      ` as { id: number; status: string }[];

      if (existingSignup.length > 0) {
        const signupId = existingSignup[0].id;
        const status = existingSignup[0].status;

        // Delete signup
        await sql`DELETE FROM weekly_signups WHERE id = ${signupId}`;

        // Promote first waitlisted player if a registered spot was freed
        if (status === 'registered') {
          const waitlisted = await sql`
            SELECT id FROM weekly_signups
            WHERE date = ${date} AND status = 'waitlisted'
            ORDER BY created_at ASC
            LIMIT 1
          ` as { id: number }[];

          if (waitlisted.length > 0) {
            await sql`
              UPDATE weekly_signups
              SET status = 'registered'
              WHERE id = ${waitlisted[0].id}
            `;
          }
        }
      }
    }

    // Process RSVP in days (signups)
    for (const inIndex of rsvpIn) {
      const date = openDates[inIndex];

      // Check if they are already signed up
      const existingSignup = await sql`
        SELECT id, status FROM weekly_signups WHERE player_id = ${player.id} AND date = ${date}
      `;

      if (existingSignup.length === 0) {
        // Count registered players
        const countRes = await sql`
          SELECT count(*) as total FROM weekly_signups WHERE date = ${date} AND status = 'registered'
        ` as { total: string }[];
        const count = parseInt(countRes[0].total, 10);
        const status = count < 6 ? 'registered' : 'waitlisted';

        await sql`
          INSERT INTO weekly_signups (player_id, date, status)
          VALUES (${player.id}, ${date}, ${status})
        `;
      }
    }

    // 6. Build Confirmation Status Message
    const confirmations = [];
    for (let i = 0; i < openDates.length; i++) {
      const date = openDates[i];
      const dateObj = new Date(`${date}T12:00:00`);
      const dayLabel = format(dateObj, 'EEE, MMM d');

      const signupRecord = await sql`
        SELECT status, created_at FROM weekly_signups 
        WHERE player_id = ${player.id} AND date = ${date}
      ` as { status: string; created_at: Date }[];

      if (signupRecord.length > 0) {
        const { status, created_at } = signupRecord[0];
        if (status === 'registered') {
          confirmations.push(`🟢 ${dayLabel} (Registered)`);
        } else {
          // Calculate waitlist position
          const positionRes = await sql`
            SELECT count(*) as position FROM weekly_signups 
            WHERE date = ${date} AND status = 'waitlisted' AND created_at <= ${created_at}
          ` as { position: string }[];
          const position = parseInt(positionRes[0].position, 10);
          confirmations.push(`⏳ ${dayLabel} (Waitlisted - Spot #${position})`);
        }
      } else {
        confirmations.push(`🔴 ${dayLabel} (Out)`);
      }
    }

    const responseBody = `Wallyball League:
Got it, ${player.name}! You are RSVP'd for:
${confirmations.join('\n')}
Thanks!`;

    return new NextResponse(
      `<Response><Message>${responseBody}</Message></Response>`,
      { headers: { 'Content-Type': 'application/xml' } }
    );
  } catch (error) {
    console.error('Error in incoming-sms webhook:', error);
    return new NextResponse(
      `<Response><Message>Wallyball League: Sorry, there was an error processing your RSVP. Please contact your admin.</Message></Response>`,
      { headers: { 'Content-Type': 'application/xml' } }
    );
  }
}
