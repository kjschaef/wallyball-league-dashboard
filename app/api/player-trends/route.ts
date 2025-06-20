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
      
      // Calculate cumulative performance by date with penalties calculated relative to each date
      const dailyStats = new Map();
      let cumulativeGamesWon = 0;
      let cumulativeGamesLost = 0;
      
      // Sort matches chronologically
      const sortedMatches = playerMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sortedMatches.forEach((match, index) => {
        const isTeamOne = match.team_one_player_one_id === player.id || 
                         match.team_one_player_two_id === player.id || 
                         match.team_one_player_three_id === player.id;
        
        const gamesWon = isTeamOne ? match.team_one_games_won : match.team_two_games_won;
        const gamesLost = isTeamOne ? match.team_two_games_won : match.team_one_games_won;
        
        cumulativeGamesWon += gamesWon;
        cumulativeGamesLost += gamesLost;
        
        const totalGames = cumulativeGamesWon + cumulativeGamesLost;
        const rawWinPercentage = totalGames > 0 ? (cumulativeGamesWon / totalGames) * 100 : 0;
        
        // Calculate inactivity penalty for this specific date
        let inactivityPenalty = 0;
        if (index > 0) {
          // Find the previous match date for this player
          const currentMatchDate = new Date(match.date);
          const previousMatchDate = new Date(sortedMatches[index - 1].date);
          
          const daysSinceLastMatch = Math.floor((currentMatchDate.getTime() - previousMatchDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksSinceLastMatch = Math.floor(daysSinceLastMatch / 7);
          
          // No penalty for first 2 weeks, then 5% per week up to 50%
          const gracePeriodWeeks = 2;
          const penaltyWeeks = Math.max(0, weeksSinceLastMatch - gracePeriodWeeks);
          const penaltyPerWeek = 5;
          const maxPenalty = 50;
          inactivityPenalty = Math.min(maxPenalty, penaltyWeeks * penaltyPerWeek);
        }
        
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
      
      // For inactive players, add synthetic weekly data points showing penalty progression
      if (playerMatches.length > 0) {
        const lastMatchDate = new Date(sortedMatches[sortedMatches.length - 1].date);
        const today = new Date();
        const daysSinceLastMatch = Math.floor((today.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If player hasn't played in over 14 days, add weekly penalty progression
        if (daysSinceLastMatch > 14) {
          const weeksSinceLastMatch = Math.floor(daysSinceLastMatch / 7);
          const gracePeriodWeeks = 2;
          const penaltyPerWeek = 5;
          const maxPenalty = 50;
          
          // Get the last recorded stats
          const lastStats = Array.from(dailyStats.values()).pop();
          if (lastStats) {
            // Add a data point for each week of inactivity
            for (let week = gracePeriodWeeks + 1; week <= weeksSinceLastMatch; week++) {
              const penaltyWeeks = week - gracePeriodWeeks;
              const weeklyPenalty = Math.min(maxPenalty, penaltyWeeks * penaltyPerWeek);
              const penalizedWinPercentage = Math.max(0, lastStats.rawWinPercentage - weeklyPenalty);
              
              // Calculate the date for this week of inactivity
              const weekDate = new Date(lastMatchDate);
              weekDate.setDate(weekDate.getDate() + (week * 7));
              
              // Don't add future dates beyond today
              if (weekDate <= today) {
                const weekKey = weekDate.toISOString().split('T')[0];
                dailyStats.set(weekKey, {
                  winPercentage: penalizedWinPercentage,
                  rawWinPercentage: lastStats.rawWinPercentage,
                  totalWins: lastStats.totalWins,
                  totalGames: lastStats.totalGames,
                  inactivityPenalty: weeklyPenalty
                });
              }
            }
            
            // Add current date with final penalty if it's different from the last weekly point
            const finalPenaltyWeeks = Math.max(0, weeksSinceLastMatch - gracePeriodWeeks);
            const currentPenalty = Math.min(maxPenalty, finalPenaltyWeeks * penaltyPerWeek);
            const todayKey = today.toISOString().split('T')[0];
            
            if (!dailyStats.has(todayKey)) {
              const penalizedWinPercentage = Math.max(0, lastStats.rawWinPercentage - currentPenalty);
              dailyStats.set(todayKey, {
                winPercentage: penalizedWinPercentage,
                rawWinPercentage: lastStats.rawWinPercentage,
                totalWins: lastStats.totalWins,
                totalGames: lastStats.totalGames,
                inactivityPenalty: currentPenalty
              });
            }
          }
        }
      }
      
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