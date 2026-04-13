import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if site_settings exists
    const settings = await sql`SELECT admin_password_hash FROM site_settings LIMIT 1`;
    
    let isValid = false;
    
    if (settings.length > 0 && settings[0].admin_password_hash) {
      // Simple string comparison for light security
      isValid = body.password === settings[0].admin_password_hash;
    } else {
      // Fallback if settings table is empty
      isValid = body.password === (process.env.ADMIN_PASSWORD || 'admin');
    }

    if (isValid) {
      const cookieStore = await cookies();
      cookieStore.set('admin_token', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
