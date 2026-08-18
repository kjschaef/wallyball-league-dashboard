import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
    
    // Fetch associated game scores
    let matchGames: any[] = [];
    try {
      matchGames = await sql`SELECT game_number, team_one_score, team_two_score FROM match_games WHERE match_id = ${matchId} ORDER BY game_number ASC`;
    } catch {
      matchGames = [];
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
      teamTwoPlayers,
      gameScores: (matchGames || []).map((mg: any) => ({
        gameNumber: mg.game_number,
        teamOneScore: mg.team_one_score,
        teamTwoScore: mg.team_two_score,
      }))
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
  
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_token')?.value === 'true';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    let teamOneGamesWon = body.teamOneGamesWon !== undefined ? body.teamOneGamesWon : existingMatches[0].team_one_games_won;
    let teamTwoGamesWon = body.teamTwoGamesWon !== undefined ? body.teamTwoGamesWon : existingMatches[0].team_two_games_won;

    const gameScores: Array<{ gameNumber: number; teamOneScore: number; teamTwoScore: number }> | undefined =
      Array.isArray(body.gameScores) ? body.gameScores : undefined;

    if (gameScores !== undefined) {
      // Validate game scores
      for (const gs of gameScores) {
        if (typeof gs.teamOneScore !== 'number' || typeof gs.teamTwoScore !== 'number' || gs.teamOneScore < 0 || gs.teamTwoScore < 0) {
          return NextResponse.json(
            { error: 'Invalid game score values: scores must be non-negative numbers' },
            { status: 400 }
          );
        }
        if (gs.teamOneScore === gs.teamTwoScore) {
          return NextResponse.json(
            { error: 'A game cannot end in a tie' },
            { status: 400 }
          );
        }
      }

      if (gameScores.length > 0) {
        teamOneGamesWon = gameScores.filter(g => g.teamOneScore > g.teamTwoScore).length;
        teamTwoGamesWon = gameScores.filter(g => g.teamTwoScore > g.teamOneScore).length;
      }
    }

    // Update match in database
    const updatedMatches = await sql`
      UPDATE matches 
      SET 
        team_one_player_one_id = ${body.teamOnePlayerOneId !== undefined ? body.teamOnePlayerOneId : existingMatches[0].team_one_player_one_id},
        team_one_player_two_id = ${body.teamOnePlayerTwoId !== undefined ? body.teamOnePlayerTwoId : existingMatches[0].team_one_player_two_id},
        team_one_player_three_id = ${body.teamOnePlayerThreeId !== undefined ? body.teamOnePlayerThreeId : existingMatches[0].team_one_player_three_id},
        team_two_player_one_id = ${body.teamTwoPlayerOneId !== undefined ? body.teamTwoPlayerOneId : existingMatches[0].team_two_player_one_id},
        team_two_player_two_id = ${body.teamTwoPlayerTwoId !== undefined ? body.teamTwoPlayerTwoId : existingMatches[0].team_two_player_two_id},
        team_two_player_three_id = ${body.teamTwoPlayerThreeId !== undefined ? body.teamTwoPlayerThreeId : existingMatches[0].team_two_player_three_id},
        team_one_games_won = ${teamOneGamesWon},
        team_two_games_won = ${teamTwoGamesWon}
      WHERE id = ${matchId}
      RETURNING *
    `;

    // Sync game scores if provided
    if (gameScores !== undefined) {
      await sql`DELETE FROM match_games WHERE match_id = ${matchId}`;
      if (gameScores.length > 0) {
        for (let i = 0; i < gameScores.length; i++) {
          const gs = gameScores[i];
          const gameNumber = gs.gameNumber || (i + 1);
          await sql`
            INSERT INTO match_games (match_id, game_number, team_one_score, team_two_score)
            VALUES (${matchId}, ${gameNumber}, ${gs.teamOneScore}, ${gs.teamTwoScore})
          `;
        }
      }
    }

    // Fetch updated game scores
    let updatedMatchGames: any[] = [];
    try {
      updatedMatchGames = await sql`SELECT game_number, team_one_score, team_two_score FROM match_games WHERE match_id = ${matchId} ORDER BY game_number ASC`;
    } catch {
      updatedMatchGames = [];
    }

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
      teamTwoPlayers,
      gameScores: (updatedMatchGames || []).map((mg: any) => ({
        gameNumber: mg.game_number,
        teamOneScore: mg.team_one_score,
        teamTwoScore: mg.team_two_score,
      }))
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

  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_token')?.value === 'true';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // Delete match from database (cascade handles match_games, but explicit deletion is safe)
    try {
      await sql`DELETE FROM match_games WHERE match_id = ${matchId}`;
    } catch {
      // Ignore if table/rows already removed
    }
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
