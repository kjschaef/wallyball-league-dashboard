import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Fetch all players
    const allPlayers = await sql`SELECT * FROM players ORDER BY name ASC`;
    
    // Fetch all matches
    const allMatches = await sql`SELECT * FROM matches ORDER BY date ASC`;
    
    const playerTrends = allPlayers.map(player => {
      // Find matches where this player participated
      const playerMatches = allMatches.filter(match => 
        match.team_one_player_one_id === player.id ||
        match.team_one_player_two_id === player.id ||
        match.team_one_player_three_id === player.id ||
        match.team_two_player_one_id === player.id ||
        match.team_two_player_two_id === player.id ||
        match.team_two_player_three_id === player.id
      );
      
      // Calculate cumulative performance by date with penalties
      const dailyStats = new Map();
      let cumulativeGamesWon = 0;
      let cumulativeGamesLost = 0;
      
      playerMatches.forEach(match => {
        const isTeamOne = match.team_one_player_one_id === player.id || 
                         match.team_one_player_two_id === player.id || 
                         match.team_one_player_three_id === player.id;
        
        const gamesWon = isTeamOne ? match.team_one_games_won : match.team_two_games_won;
        const gamesLost = isTeamOne ? match.team_two_games_won : match.team_one_games_won;
        
        cumulativeGamesWon += gamesWon;
        cumulativeGamesLost += gamesLost;
        
        const totalGames = cumulativeGamesWon + cumulativeGamesLost;
        const rawWinPercentage = totalGames > 0 ? (cumulativeGamesWon / totalGames) * 100 : 0;
        
        // Calculate inactivity penalty for this data point
        const currentDate = new Date();
        const matchDate = new Date(match.date);
        const daysSinceMatch = Math.floor((currentDate.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksSinceMatch = Math.floor(daysSinceMatch / 7);
        
        // No penalty for first 2 weeks, then 5% per week up to 50%
        const gracePeriodWeeks = 2;
        const penaltyWeeks = Math.max(0, weeksSinceMatch - gracePeriodWeeks);
        const penaltyPerWeek = 5;
        const maxPenalty = 50;
        const inactivityPenalty = Math.min(maxPenalty, penaltyWeeks * penaltyPerWeek);
        
        const penalizedWinPercentage = Math.max(0, rawWinPercentage - inactivityPenalty);
        
        const dateKey = match.date ? new Date(match.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        dailyStats.set(dateKey, {
          winPercentage: penalizedWinPercentage,
          rawWinPercentage: rawWinPercentage,
          totalWins: cumulativeGamesWon,
          totalGames: totalGames,
          inactivityPenalty: inactivityPenalty
        });
      });
      
      return {
        id: player.id,
        name: player.name,
        dailyStats: Object.fromEntries(dailyStats)
      };
    });
    
    return NextResponse.json(playerTrends);
  } catch (error) {
    console.error('Error fetching player trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player trends' },
      { status: 500 }
    );
  }
}