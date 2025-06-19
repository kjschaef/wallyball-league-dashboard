import { NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

interface TeamStats {
  playerIds: number[];
  players: string[];
  matchWins: number;
  matchLosses: number;
  totalMatches: number;
  gameWins: number;
  gameLosses: number;
  totalGames: number;
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get all matches with player data
    const allMatches = await sql`
      SELECT 
        id,
        team_one_player_one_id,
        team_one_player_two_id, 
        team_one_player_three_id,
        team_two_player_one_id,
        team_two_player_two_id,
        team_two_player_three_id,
        team_one_games_won,
        team_two_games_won
      FROM matches
    `;

    // Get all players to map IDs to names
    const allPlayers = await sql`SELECT id, name FROM players`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerMap = new Map(allPlayers.map((p: any) => [p.id, p.name]));

    // Track team combinations and their performance
    const teamStats = new Map<string, TeamStats>();

    for (const match of allMatches) {
      // Extract player IDs for each team, filtering out nulls
      const teamOneIds = [
        match.team_one_player_one_id,
        match.team_one_player_two_id,
        match.team_one_player_three_id
      ].filter((id): id is number => id !== null);
      
      const teamTwoIds = [
        match.team_two_player_one_id,
        match.team_two_player_two_id,
        match.team_two_player_three_id
      ].filter((id): id is number => id !== null);
      
      // Create sorted team keys for consistent identification
      const teamOneKey = [...teamOneIds].sort((a: number, b: number) => a - b).join(',');
      const teamTwoKey = [...teamTwoIds].sort((a: number, b: number) => a - b).join(',');
      
      // Get player names and sort them
      const teamOnePlayers = teamOneIds.map((id: number) => playerMap.get(id) || 'Unknown').sort();
      const teamTwoPlayers = teamTwoIds.map((id: number) => playerMap.get(id) || 'Unknown').sort();

      // Initialize team stats if not exists
      if (!teamStats.has(teamOneKey)) {
        teamStats.set(teamOneKey, {
          playerIds: teamOneIds,
          players: teamOnePlayers,
          matchWins: 0,
          matchLosses: 0,
          totalMatches: 0,
          gameWins: 0,
          gameLosses: 0,
          totalGames: 0
        });
      }
      
      if (!teamStats.has(teamTwoKey)) {
        teamStats.set(teamTwoKey, {
          playerIds: teamTwoIds,
          players: teamTwoPlayers,
          matchWins: 0,
          matchLosses: 0,
          totalMatches: 0,
          gameWins: 0,
          gameLosses: 0,
          totalGames: 0
        });
      }

      // Update stats based on match result
      const teamOneStats = teamStats.get(teamOneKey)!;
      const teamTwoStats = teamStats.get(teamTwoKey)!;

      // Track match wins/losses (best of X games)
      if (match.team_one_games_won > match.team_two_games_won) {
        teamOneStats.matchWins++;
        teamTwoStats.matchLosses++;
      } else if (match.team_two_games_won > match.team_one_games_won) {
        teamTwoStats.matchWins++;
        teamOneStats.matchLosses++;
      }
      // Ties don't count as match wins or losses

      // Track individual game wins/losses
      teamOneStats.gameWins += match.team_one_games_won || 0;
      teamOneStats.gameLosses += match.team_two_games_won || 0;
      teamTwoStats.gameWins += match.team_two_games_won || 0;
      teamTwoStats.gameLosses += match.team_one_games_won || 0;

      // Track totals
      teamOneStats.totalMatches++;
      teamTwoStats.totalMatches++;
      teamOneStats.totalGames += (match.team_one_games_won || 0) + (match.team_two_games_won || 0);
      teamTwoStats.totalGames += (match.team_one_games_won || 0) + (match.team_two_games_won || 0);
    }

    // Convert to array and calculate win percentages
    const teamPerformanceArray = Array.from(teamStats.entries()).map(([_key, stats], index) => ({
      id: index + 1,
      players: stats.players,
      wins: stats.matchWins,
      losses: stats.matchLosses,
      totalGames: stats.totalMatches,
      winPercentage: stats.totalMatches > 0 ? Number(((stats.matchWins / stats.totalMatches) * 100).toFixed(1)) : 0,
      // Additional detailed stats
      gameWins: stats.gameWins,
      gameLosses: stats.gameLosses,
      totalIndividualGames: stats.totalGames,
      gameWinPercentage: stats.totalGames > 0 ? Number(((stats.gameWins / stats.totalGames) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.winPercentage - a.winPercentage); // Sort by win percentage descending

    return NextResponse.json(teamPerformanceArray);
    
  } catch (error) {
    console.error('Error fetching team performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team performance data' },
      { status: 500 }
    );
  }
}