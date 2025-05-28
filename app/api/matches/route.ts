import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Fetch matches from database
    let allMatches;
    
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        allMatches = await sql`SELECT * FROM matches ORDER BY date DESC LIMIT ${limitNum}`;
      } else {
        allMatches = await sql`SELECT * FROM matches ORDER BY date DESC`;
      }
    } else {
      allMatches = await sql`SELECT * FROM matches ORDER BY date DESC`;
    }
    
    // Get all players to map IDs to names
    const allPlayers = await sql`SELECT * FROM players`;
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    // Process matches to include player names
    const processedMatches = allMatches.map(match => {
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
      
      return {
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
    });
    
    return NextResponse.json(processedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation for the documented API format
    if (body.teamOnePlayerOneId === undefined || body.teamTwoPlayerOneId === undefined) {
      return NextResponse.json(
        { error: 'At least one player per team is required' },
        { status: 400 }
      );
    }

    if (body.teamOneGamesWon === undefined || body.teamTwoGamesWon === undefined) {
      return NextResponse.json(
        { error: 'Game scores are required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Create new match in database
    const newMatches = await sql`
      INSERT INTO matches (
        team_one_player_one_id, team_one_player_two_id, team_one_player_three_id,
        team_two_player_one_id, team_two_player_two_id, team_two_player_three_id,
        team_one_games_won, team_two_games_won, date
      )
      VALUES (
        ${body.teamOnePlayerOneId}, ${body.teamOnePlayerTwoId || null}, ${body.teamOnePlayerThreeId || null},
        ${body.teamTwoPlayerOneId}, ${body.teamTwoPlayerTwoId || null}, ${body.teamTwoPlayerThreeId || null},
        ${body.teamOneGamesWon}, ${body.teamTwoGamesWon}, ${body.date ? new Date(body.date) : new Date()}
      )
      RETURNING *
    `;

    // Get player names for the response
    const allPlayers = await sql`SELECT * FROM players`;
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    const match = newMatches[0];
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
    
    return NextResponse.json(responseMatch, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}