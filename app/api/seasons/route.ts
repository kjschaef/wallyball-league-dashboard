import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { listSeasons } from '../../../lib/seasons';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      // If no DB configured, fall back to computed seasons
      const seasons = listSeasons(12);
      seasons.push({ id: 0, name: 'Lifetime', start_date: '', end_date: '' });
      return NextResponse.json(seasons);
    }

    const sql = neon(process.env.DATABASE_URL);
    // Find earliest match date so we only show seasons that contain matches
    const res = await sql`SELECT MIN(date) as min_date FROM matches`;
    let seasons;
    if (res && res.length > 0 && res[0].min_date) {
      const earliest = new Date(res[0].min_date).toISOString();
      seasons = listSeasons(0, earliest); // 0 means compute from earliest to current
    } else {
      seasons = listSeasons(12);
    }
    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
}
