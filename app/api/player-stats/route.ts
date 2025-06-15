import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

interface PlayerStats {
  id: number;
  name: string;
  yearsPlayed: number;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  winPercentage: number;
  totalPlayingTime: number;
  streak: {
    type: 'wins' | 'losses';
    count: number;
  };
  actualWinPercentage?: number;
  inactivityPenalty?: number;
}

function calculateStreak(matches: Array<{ won: boolean; date: string }>): { type: 'wins' | 'losses'; count: number } {
  if (matches.length === 0) return { type: 'wins', count: 0 };
  
  // Sort matches by date descending (most recent first)
  const sortedMatches = matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const mostRecentResult = sortedMatches[0].won;
  let streakCount = 0;
  
  for (const match of sortedMatches) {
    if (match.won === mostRecentResult) {
      streakCount++;
    } else {
      break;
    }
  }
  
  return {
    type: mostRecentResult ? 'wins' : 'losses',
    count: streakCount
  };
}

function calculateInactivityPenalty(matches: Array<{ date: string }>, createdAt: string | null): number {
  if (matches.length === 0 || !createdAt) return 0;
  
  const now = new Date();
  const lastMatchDate = matches.length > 0 
    ? new Date(Math.max(...matches.map(m => new Date(m.date).getTime())))
    : new Date(createdAt);
  
  const daysSinceLastMatch = Math.floor((now.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksSinceLastMatch = Math.floor(daysSinceLastMatch / 7);
  
  // No penalty for first 2 weeks
  if (weeksSinceLastMatch <= 2) return 0;
  
  // 5% penalty per week after 2 weeks, capped at 50%
  const penaltyWeeks = weeksSinceLastMatch - 2;
  return Math.min(penaltyWeeks * 5, 50);
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Fetch all players
    const allPlayers = await sql`SELECT * FROM players ORDER BY name ASC`;
    
    // Fetch all matches
    const allMatches = await sql`SELECT * FROM matches ORDER BY date DESC`;
    
    const playerStats: PlayerStats[] = allPlayers.map(player => {
      // Find matches where this player participated
      const playerMatches = allMatches.filter(match => 
        match.team_one_player_one_id === player.id ||
        match.team_one_player_two_id === player.id ||
        match.team_one_player_three_id === player.id ||
        match.team_two_player_one_id === player.id ||
        match.team_two_player_two_id === player.id ||
        match.team_two_player_three_id === player.id
      );
      
      // Process matches to determine wins/losses for this player
      const processedMatches = playerMatches.map(match => {
        const isTeamOne = match.team_one_player_one_id === player.id || 
                         match.team_one_player_two_id === player.id || 
                         match.team_one_player_three_id === player.id;
        
        const won = isTeamOne 
          ? match.team_one_games_won > match.team_two_games_won
          : match.team_two_games_won > match.team_one_games_won;
        
        return {
          won,
          date: match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
          teamOneGamesWon: match.team_one_games_won,
          teamTwoGamesWon: match.team_two_games_won
        };
      });
      
      // Calculate basic stats
      const wins = processedMatches.filter(match => match.won).length;
      const losses = processedMatches.filter(match => !match.won).length;
      const totalGames = processedMatches.reduce((total, match) => 
        total + match.teamOneGamesWon + match.teamTwoGamesWon, 0
      );
      
      // Calculate years played
      const createdAt = player.created_at ? new Date(player.created_at) : new Date();
      const startYear = player.start_year || createdAt.getFullYear();
      const currentYear = new Date().getFullYear();
      const yearsPlayed = Math.max(1, currentYear - startYear + 1);
      
      // Calculate total playing time (estimate 40 minutes per match)
      const totalPlayingTime = processedMatches.length * 40;
      
      // Calculate streak
      const streak = calculateStreak(processedMatches);
      
      // Calculate win percentage and inactivity penalty
      const actualWinPercentage = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
      const inactivityPenalty = calculateInactivityPenalty(processedMatches, player.created_at);
      const winPercentage = Math.max(0, actualWinPercentage - inactivityPenalty);
      
      return {
        id: player.id,
        name: player.name,
        yearsPlayed,
        record: {
          wins,
          losses,
          totalGames
        },
        winPercentage: Math.round(winPercentage),
        totalPlayingTime,
        streak,
        actualWinPercentage: Math.round(actualWinPercentage),
        inactivityPenalty
      };
    });
    
    // Sort by win percentage descending
    playerStats.sort((a, b) => b.winPercentage - a.winPercentage);
    
    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player statistics' },
      { status: 500 }
    );
  }
}