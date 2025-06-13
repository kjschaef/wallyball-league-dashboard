import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { matches } from '../../../db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get total matches count
    const totalMatchesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches);
    
    const totalMatches = Number(totalMatchesResult[0]?.count) || 0;

    // Get total games and calculate average
    const gamesResult = await db
      .select({
        totalGames: sql<number>`sum(team_one_games_won + team_two_games_won)`,
      })
      .from(matches);

    const totalGames = Number(gamesResult[0]?.totalGames) || 0;
    const avgGamesPerMatch = totalMatches > 0 ? Number((totalGames / totalMatches).toFixed(1)) : 0;

    return NextResponse.json({
      totalMatches,
      totalGames,
      avgGamesPerMatch
    });
  } catch (error) {
    console.error('Error fetching season stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch season statistics' },
      { status: 500 }
    );
  }
}