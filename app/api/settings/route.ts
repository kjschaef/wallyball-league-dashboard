import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import {
  DEFAULT_SIGNUP_SETTINGS,
  normalizeTimeInputValue,
  parseAvailableDays,
} from '../../lib/signups';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        signupOpenDayOfWeek: settings[0].signup_open_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupOpenDayOfWeek,
        signupOpenTime: normalizeTimeInputValue(
          settings[0].signup_open_time,
          DEFAULT_SIGNUP_SETTINGS.signupOpenTime,
        ),
        signupCloseDayOfWeek: settings[0].signup_close_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupCloseDayOfWeek,
        signupCloseTime: normalizeTimeInputValue(
          settings[0].signup_close_time,
          DEFAULT_SIGNUP_SETTINGS.signupCloseTime,
        ),
        availableDays: parseAvailableDays(settings[0].available_days)
      });
    }
    
    // Defaults matching our schema
    return NextResponse.json(DEFAULT_SIGNUP_SETTINGS);
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
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_token')?.value === 'true';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const normalizedOpenTime = normalizeTimeInputValue(
      body.signupOpenTime,
      DEFAULT_SIGNUP_SETTINGS.signupOpenTime,
    );
    const normalizedCloseTime = normalizeTimeInputValue(
      body.signupCloseTime,
      DEFAULT_SIGNUP_SETTINGS.signupCloseTime,
    );
    
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
          signup_open_time = COALESCE(${normalizedOpenTime}, signup_open_time),
          signup_close_day_of_week = COALESCE(${body.signupCloseDayOfWeek}, signup_close_day_of_week),
          signup_close_time = COALESCE(${normalizedCloseTime}, signup_close_time),
          available_days = COALESCE(${JSON.stringify(body.availableDays)}, available_days),
          admin_password_hash = COALESCE(${body.adminPassword}, admin_password_hash)
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO site_settings (signup_open_day_of_week, signup_open_time, signup_close_day_of_week, signup_close_time, available_days, admin_password_hash)
        VALUES (
          ${body.signupOpenDayOfWeek ?? 0}, 
          ${normalizedOpenTime}, 
          ${body.signupCloseDayOfWeek ?? 0},
          ${normalizedCloseTime},
          ${JSON.stringify(body.availableDays || DEFAULT_SIGNUP_SETTINGS.availableDays)},
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
