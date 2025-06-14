import { NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Use raw SQL to get statistics
    const result = await sql`
      SELECT 
        COUNT(*) as total_matches,
        SUM(team_one_games_won + team_two_games_won) as total_games
      FROM matches
    `;
    
    const totalMatches = Number(result[0]?.total_matches) || 0;
    const totalGames = Number(result[0]?.total_games) || 0;
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