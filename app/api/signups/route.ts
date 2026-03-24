import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

function getEstNow() {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
}

function isSignupOpen(targetDateStr: string, openDayOfWeek: number, openTime: string) {
  const targetDate = new Date(`${targetDateStr}T12:00:00-05:00`); // using roughly EST offset for date math
  const [hours, minutes] = openTime.split(':').map(Number);
  
  // Find the Sunday that starts this target date's calendar week
  const weekStartSunday = new Date(targetDate);
  weekStartSunday.setDate(targetDate.getDate() - targetDate.getDay());
  
  // The signups for this calendar week open on the openDayOfWeek of the PRECEDING week
  const openDateTime = new Date(weekStartSunday);
  openDateTime.setDate(weekStartSunday.getDate() - 7 + openDayOfWeek);
  openDateTime.setHours(hours, minutes, 0, 0);
  
  return getEstNow() >= openDateTime;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const playerParam = url.searchParams.get('playerId');
    
    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);
    
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
    const { playerId, date } = body;
    
    if (!playerId || !date) {
      return NextResponse.json({ error: 'playerId and date are required' }, { status: 400 });
    }
    
    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    // Check if open
    const settings = await sql`SELECT signup_open_day_of_week, signup_open_time FROM site_settings LIMIT 1`;
    const isAdmin = cookies().get('admin_token')?.value === 'true';
    
    if (settings.length > 0 && !isAdmin) {
      const { signup_open_day_of_week, signup_open_time } = settings[0];
      if (!isSignupOpen(date, signup_open_day_of_week, signup_open_time)) {
        return NextResponse.json({ error: 'Signups are not open yet for this date' }, { status: 403 });
      }
    }

    // Check existing signup
    const existing = await sql`SELECT id FROM weekly_signups WHERE player_id = ${playerId} AND date = ${date}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Player already signed up for this date' }, { status: 400 });
    }

    // Determine status based on current count
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
    const { id, playerId, date } = body;

    if (!id && !(playerId && date)) {
        return NextResponse.json({ error: 'id or (playerId and date) required' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    // Get the signup to check its status before deleting
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

    // Delete it
    await sql`DELETE FROM weekly_signups WHERE id = ${signupId}`;

    // If it was registered, promote the first waitlisted person
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
