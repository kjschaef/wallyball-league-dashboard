import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { matches } from '../../../db/schema';
import { count, sum } from 'drizzle-orm';

export async function GET() {
  try {
    // Get total matches count
    const totalMatchesResult = await db
      .select({ count: count() })
      .from(matches);
    
    const totalMatches = Number(totalMatchesResult[0]?.count) || 0;

    // Get total games and calculate average
    const gamesResult = await db
      .select({
        totalGames: sum(matches.teamOneGamesWon),
        totalGamesTwo: sum(matches.teamTwoGamesWon),
      })
      .from(matches);

    const teamOneTotal = Number(gamesResult[0]?.totalGames) || 0;
    const teamTwoTotal = Number(gamesResult[0]?.totalGamesTwo) || 0;
    const totalGames = teamOneTotal + teamTwoTotal;
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