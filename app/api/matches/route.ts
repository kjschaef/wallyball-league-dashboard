import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  const stats = searchParams.get('stats');

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }

    const sql = neon(process.env.DATABASE_URL);

    // If stats requested, return aggregated statistics
    if (stats === 'true') {
      const allMatches = await sql`SELECT team_one_games_won, team_two_games_won, date FROM matches`;
      const totalMatches = allMatches.length;
      const totalGames = allMatches.reduce((sum, match) =>
        sum + (match.team_one_games_won || 0) + (match.team_two_games_won || 0), 0
      );

      // Count distinct days with matches
      const uniqueDays = new Set(
        allMatches.map(match =>
          match.date ? new Date(match.date).toISOString().split('T')[0] : null
        ).filter(Boolean)
      );
      const totalDaysPlayed = uniqueDays.size;

      return NextResponse.json({
        totalMatches,
        totalGames,
        totalDaysPlayed
      });
    }

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

    // Fetch match games to attach game scores
    let allMatchGames: any[] = [];
    try {
      allMatchGames = await sql`SELECT match_id, game_number, team_one_score, team_two_score FROM match_games ORDER BY match_id, game_number ASC`;
    } catch {
      // In case table is not yet populated or in test environment
      allMatchGames = [];
    }

    const gamesMap = new Map<number, Array<{ gameNumber: number; teamOneScore: number; teamTwoScore: number }>>();
    if (Array.isArray(allMatchGames)) {
      for (const mg of allMatchGames) {
        if (!gamesMap.has(mg.match_id)) {
          gamesMap.set(mg.match_id, []);
        }
        gamesMap.get(mg.match_id)!.push({
          gameNumber: mg.game_number,
          teamOneScore: mg.team_one_score,
          teamTwoScore: mg.team_two_score,
        });
      }
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
        teamTwoPlayers,
        gameScores: gamesMap.get(match.id) || []
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

async function getPlayerIdsFromNames(sql: any, playerNames: string[]) {
  if (playerNames.length === 0) {
    return [];
  }
  const placeholders = playerNames.map((_, i) => `$${i + 1}`).join(', ');
  const query = `SELECT id FROM players WHERE name IN (${placeholders})`;
  const players = await sql.query(query, playerNames);
  return players.map((p: any) => p.id);
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_token')?.value === 'true';
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }

    const sql = neon(process.env.DATABASE_URL);

    const teamOnePlayerIds: (number | null)[] = [null, null, null];
    const teamTwoPlayerIds: (number | null)[] = [null, null, null];
    let teamOneGamesWon: number;
    let teamTwoGamesWon: number;

    const gameScores: Array<{ gameNumber: number; teamOneScore: number; teamTwoScore: number }> =
      Array.isArray(body.gameScores) ? body.gameScores : [];

    // Validate game scores if provided
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

    if (body.matchNumber) { // This is a MatchResult from image analysis
      const team1Ids = await getPlayerIdsFromNames(sql, body.team1.players);
      const team2Ids = await getPlayerIdsFromNames(sql, body.team2.players);

      for (let i = 0; i < team1Ids.length; i++) {
        teamOnePlayerIds[i] = team1Ids[i];
      }
      for (let i = 0; i < team2Ids.length; i++) {
        teamTwoPlayerIds[i] = team2Ids[i];
      }
      teamOneGamesWon = body.team1.wins;
      teamTwoGamesWon = body.team2.wins;

    } else { // Regular match creation request
      if (body.teamOnePlayerOneId === undefined || body.teamTwoPlayerOneId === undefined) {
        return NextResponse.json(
          { error: 'At least one player per team is required' },
          { status: 400 }
        );
      }

      if (gameScores.length > 0) {
        // Auto-calculate games won from scores
        teamOneGamesWon = gameScores.filter(g => g.teamOneScore > g.teamTwoScore).length;
        teamTwoGamesWon = gameScores.filter(g => g.teamTwoScore > g.teamOneScore).length;
      } else {
        if (body.teamOneGamesWon === undefined || body.teamTwoGamesWon === undefined) {
          return NextResponse.json(
            { error: 'Game scores are required' },
            { status: 400 }
          );
        }
        teamOneGamesWon = body.teamOneGamesWon;
        teamTwoGamesWon = body.teamTwoGamesWon;
      }

      teamOnePlayerIds[0] = body.teamOnePlayerOneId;
      teamOnePlayerIds[1] = body.teamOnePlayerTwoId || null;
      teamOnePlayerIds[2] = body.teamOnePlayerThreeId || null;
      teamTwoPlayerIds[0] = body.teamTwoPlayerOneId;
      teamTwoPlayerIds[1] = body.teamTwoPlayerTwoId || null;
      teamTwoPlayerIds[2] = body.teamTwoPlayerThreeId || null;
    }

    // Create new match in database
    const newMatches = await sql`
      INSERT INTO matches (
        team_one_player_one_id, team_one_player_two_id, team_one_player_three_id,
        team_two_player_one_id, team_two_player_two_id, team_two_player_three_id,
        team_one_games_won, team_two_games_won, date
      )
      VALUES (
        ${teamOnePlayerIds[0]}, ${teamOnePlayerIds[1]}, ${teamOnePlayerIds[2]},
        ${teamTwoPlayerIds[0]}, ${teamTwoPlayerIds[1]}, ${teamTwoPlayerIds[2]},
        ${teamOneGamesWon}, ${teamTwoGamesWon}, ${body.date ? new Date(body.date + 'T12:00:00') : new Date()}
      )
      RETURNING *
    `;

    const match = newMatches[0];

    // Insert game scores if provided
    if (gameScores.length > 0) {
      for (let i = 0; i < gameScores.length; i++) {
        const gs = gameScores[i];
        const gameNumber = gs.gameNumber || (i + 1);
        await sql`
          INSERT INTO match_games (match_id, game_number, team_one_score, team_two_score)
          VALUES (${match.id}, ${gameNumber}, ${gs.teamOneScore}, ${gs.teamTwoScore})
        `;
      }
    }

    // Get player names for the response
    const allPlayers = await sql`SELECT * FROM players`;
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));

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
      gameScores: gameScores.map((g, idx) => ({
        gameNumber: g.gameNumber || (idx + 1),
        teamOneScore: g.teamOneScore,
        teamTwoScore: g.teamTwoScore
      }))
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
