import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { calculatePlayerStats } from '../../lib/stats';

export async function GET(request: Request) {

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }

    const sql = neon(process.env.DATABASE_URL);
    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get('season');

    // Fetch all players
    const allPlayers = await sql`SELECT * FROM players ORDER BY created_at DESC`;

    // Handle season filtering
    let seasonData: unknown = null;
    let allMatches;

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now


    if (seasonParam) {
      // Resolve season param against computed quarters
      const { listSeasons, getSeasonById } = await import('../../../lib/seasons');
      const computedSeasons = listSeasons(32);
      if (seasonParam === 'current') {
        const s = computedSeasons[0];
        seasonData = s;
        allMatches = await sql`SELECT * FROM matches WHERE date >= ${s.start_date} AND date <= ${tomorrow} ORDER BY date DESC`;
      } else if (seasonParam === 'lifetime') {
        allMatches = await sql`SELECT * FROM matches WHERE date <= ${tomorrow} ORDER BY date DESC`;
      } else if (!isNaN(Number(seasonParam))) {
        const sid = Number(seasonParam);
        const s = getSeasonById(sid);
        if (!s) return NextResponse.json({ error: 'Season not found' }, { status: 404 });
        seasonData = s as any;
        allMatches = await sql`SELECT * FROM matches WHERE date >= ${s.start_date} AND date <= ${s.end_date} ORDER BY date DESC`;
      } else {
        return NextResponse.json({ error: 'Invalid season parameter. Use "current", "lifetime", or a season ID.' }, { status: 400 });
      }
    } else {
      allMatches = await sql`SELECT * FROM matches WHERE date <= ${tomorrow} ORDER BY date DESC`;
    }

    const playerStats = await calculatePlayerStats(allPlayers, allMatches, sql, seasonParam, seasonData);

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player statistics' },
      { status: 500 }
    );
  }
}

