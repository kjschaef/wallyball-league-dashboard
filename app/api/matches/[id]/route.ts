
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  const matchId = parseInt(resolvedParams.id);

  if (isNaN(matchId)) {
    return NextResponse.json(
      { error: 'Invalid match ID' },
      { status: 400 }
    );
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Get the specific match
    const matches = await sql`SELECT * FROM matches WHERE id = ${matchId}`;
    
    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    // Get all players to map IDs to names
    const allPlayers = await sql`SELECT * FROM players`;
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    const match = matches[0];
    const teamOnePlayers = [
      match.team_one_player_one_id && playerMap.get(match.team_one_player_one_id),
      match.team_one_player_two_id && playerMap.get(match.team_one_player_two_id),
      match.team_one_player_three_id && playerMap.get(match.team_one_player_three_id)
    ].filter(Boolean);
    
    const teamTwoPlayers = [
      match.team_two_player_one_id && playerMap.get(match.team_two_player_one_id),
      match.team_two_player_two_id && playerMap.get(match.team_two_player_two_id),
      match.team_two_player_three_id && playerMap.get(match.team_two_player_three_id)
    ].filter(Boolean);
    
    const processedMatch = {
      id: match.id,
      teamOnePlayerOneId: match.team_one_player_one_id,
      teamOnePlayerTwoId: match.team_one_player_two_id,
      teamOnePlayerThreeId: match.team_one_player_three_id,
      teamTwoPlayerOneId: match.team_two_player_one_id,
      teamTwoPlayerTwoId: match.team_two_player_two_id,
      teamTwoPlayerThreeId: match.team_two_player_three_id,
      teamOneGamesWon: match.team_one_games_won,
      teamTwoGamesWon: match.team_two_games_won,
      date: match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
      teamOnePlayers,
      teamTwoPlayers
    };

    return NextResponse.json(processedMatch);
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  const matchId = parseInt(resolvedParams.id);
  const body = await request.json();

  if (isNaN(matchId)) {
    return NextResponse.json(
      { error: 'Invalid match ID' },
      { status: 400 }
    );
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Check if match exists
    const existingMatches = await sql`SELECT * FROM matches WHERE id = ${matchId}`;
    
    if (existingMatches.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Update match in database
    const updatedMatches = await sql`
      UPDATE matches 
      SET 
        team_one_player_one_id = ${body.teamOnePlayerOneId || existingMatches[0].team_one_player_one_id},
        team_one_player_two_id = ${body.teamOnePlayerTwoId || existingMatches[0].team_one_player_two_id},
        team_one_player_three_id = ${body.teamOnePlayerThreeId || existingMatches[0].team_one_player_three_id},
        team_two_player_one_id = ${body.teamTwoPlayerOneId || existingMatches[0].team_two_player_one_id},
        team_two_player_two_id = ${body.teamTwoPlayerTwoId || existingMatches[0].team_two_player_two_id},
        team_two_player_three_id = ${body.teamTwoPlayerThreeId || existingMatches[0].team_two_player_three_id},
        team_one_games_won = ${body.teamOneGamesWon !== undefined ? body.teamOneGamesWon : existingMatches[0].team_one_games_won},
        team_two_games_won = ${body.teamTwoGamesWon !== undefined ? body.teamTwoGamesWon : existingMatches[0].team_two_games_won}
      WHERE id = ${matchId}
      RETURNING *
    `;

    // Get player names for the response
    const allPlayers = await sql`SELECT * FROM players`;
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    const match = updatedMatches[0];
    const teamOnePlayers = [
      match.team_one_player_one_id && playerMap.get(match.team_one_player_one_id),
      match.team_one_player_two_id && playerMap.get(match.team_one_player_two_id),
      match.team_one_player_three_id && playerMap.get(match.team_one_player_three_id)
    ].filter(Boolean);
    
    const teamTwoPlayers = [
      match.team_two_player_one_id && playerMap.get(match.team_two_player_one_id),
      match.team_two_player_two_id && playerMap.get(match.team_two_player_two_id),
      match.team_two_player_three_id && playerMap.get(match.team_two_player_three_id)
    ].filter(Boolean);
    
    const responseMatch = {
      id: match.id,
      teamOnePlayerOneId: match.team_one_player_one_id,
      teamOnePlayerTwoId: match.team_one_player_two_id,
      teamOnePlayerThreeId: match.team_one_player_three_id,
      teamTwoPlayerOneId: match.team_two_player_one_id,
      teamTwoPlayerTwoId: match.team_two_player_two_id,
      teamTwoPlayerThreeId: match.team_two_player_three_id,
      teamOneGamesWon: match.team_one_games_won,
      teamTwoGamesWon: match.team_two_games_won,
      date: new Date(match.date).toISOString(),
      teamOnePlayers,
      teamTwoPlayers
    };

    return NextResponse.json(responseMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  const matchId = parseInt(resolvedParams.id);

  if (isNaN(matchId)) {
    return NextResponse.json(
      { error: 'Invalid match ID' },
      { status: 400 }
    );
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Check if match exists
    const existingMatches = await sql`SELECT * FROM matches WHERE id = ${matchId}`;
    
    if (existingMatches.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Delete match from database
    await sql`DELETE FROM matches WHERE id = ${matchId}`;

    return NextResponse.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}
