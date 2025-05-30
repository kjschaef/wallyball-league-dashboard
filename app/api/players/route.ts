import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Fetch all players from database
    const allPlayers = await sql`SELECT * FROM players ORDER BY created_at DESC`;
    
    // Fetch all matches to calculate statistics
    const allMatches = await sql`SELECT * FROM matches ORDER BY date DESC`;
    
    // Process each player to include matches and statistics
    const playersWithStats = allPlayers.map(player => {
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
          id: match.id,
          date: match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
          won,
          isTeamOne,
          teamOneGamesWon: match.team_one_games_won,
          teamTwoGamesWon: match.team_two_games_won
        };
      });
      
      // Calculate statistics
      const won = processedMatches.filter(match => match.won).length;
      const lost = processedMatches.filter(match => !match.won).length;
      const totalGames = processedMatches.reduce((total, match) => 
        total + match.teamOneGamesWon + match.teamTwoGamesWon, 0
      );
      const totalMatchTime = processedMatches.length * 40; // Estimate 40 minutes per match
      
      return {
        id: player.id,
        name: player.name,
        startYear: player.start_year,
        createdAt: player.created_at ? new Date(player.created_at).toISOString() : null,
        matches: processedMatches,
        stats: {
          won,
          lost,
          totalGames,
          totalMatchTime
        }
      };
    });
    
    return NextResponse.json(playersWithStats);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Create new player in database
    const newPlayers = await sql`
      INSERT INTO players (name, start_year, created_at)
      VALUES (${body.name.trim()}, ${body.startYear || new Date().getFullYear()}, NOW())
      RETURNING *
    `;

    const newPlayer = newPlayers[0];

    // Return the new player with empty matches and stats
    const playerWithStats = {
      id: newPlayer.id,
      name: newPlayer.name,
      startYear: newPlayer.start_year,
      createdAt: new Date(newPlayer.created_at).toISOString(),
      matches: [],
      stats: { won: 0, lost: 0, totalGames: 0, totalMatchTime: 0 }
    };
    
    return NextResponse.json(playerWithStats, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}