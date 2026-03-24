import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Fetch settings or return defaults
    const settings = await sql`SELECT * FROM site_settings LIMIT 1`;
    
    if (settings.length > 0) {
      return NextResponse.json({
        signupOpenDayOfWeek: settings[0].signup_open_day_of_week,
        signupOpenTime: settings[0].signup_open_time,
        signupCloseDayOfWeek: settings[0].signup_close_day_of_week ?? 0,
        signupCloseTime: settings[0].signup_close_time ?? '16:00',
        availableDays: JSON.parse(settings[0].available_days || '["Monday", "Tuesday", "Thursday"]')
      });
    }
    
    // Defaults matching our schema
    return NextResponse.json({
      signupOpenDayOfWeek: 0, // Sunday
      signupOpenTime: '12:00', // Noon
      signupCloseDayOfWeek: 0, // Sunday
      signupCloseTime: '16:00', // 4 PM
      availableDays: ["Monday", "Tuesday", "Thursday"]
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Check admin auth
    const cookieStore = cookies();
    const isAdmin = cookieStore.get('admin_token')?.value === 'true';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Upsert logic for site_settings
    const existing = await sql`SELECT id FROM site_settings LIMIT 1`;
    
    if (existing.length > 0) {
      await sql`
        UPDATE site_settings 
        SET 
          signup_open_day_of_week = COALESCE(${body.signupOpenDayOfWeek}, signup_open_day_of_week),
          signup_open_time = COALESCE(${body.signupOpenTime}, signup_open_time),
          signup_close_day_of_week = COALESCE(${body.signupCloseDayOfWeek}, signup_close_day_of_week),
          signup_close_time = COALESCE(${body.signupCloseTime}, signup_close_time),
          available_days = COALESCE(${JSON.stringify(body.availableDays)}, available_days),
          admin_password_hash = COALESCE(${body.adminPassword}, admin_password_hash)
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO site_settings (signup_open_day_of_week, signup_open_time, signup_close_day_of_week, signup_close_time, available_days, admin_password_hash)
        VALUES (
          ${body.signupOpenDayOfWeek ?? 0}, 
          ${body.signupOpenTime || '12:00'}, 
          ${body.signupCloseDayOfWeek ?? 0},
          ${body.signupCloseTime || '16:00'},
          ${JSON.stringify(body.availableDays || ["Monday", "Tuesday", "Thursday"])},
          ${body.adminPassword || 'admin'}
        )
      `;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
