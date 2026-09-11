import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
      const lastGameDate = processedMatches.length > 0
        ? new Date(Math.max(...processedMatches.map(m => new Date(m.date).getTime()))).toISOString()
        : null;
      
      return {
        id: player.id,
        name: player.name,
        startYear: player.start_year,
        createdAt: player.created_at ? new Date(player.created_at).toISOString() : null,
        isActive: player.is_active !== false && player.deleted_at == null,
        deletedAt: player.deleted_at ? new Date(player.deleted_at).toISOString() : null,
        matches: processedMatches,
        lastGameDate,
        stats: {
          won,
          lost,
          totalGames
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
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_token')?.value === 'true';
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      INSERT INTO players (name, start_year, is_active, created_at)
      VALUES (${body.name.trim()}, ${body.startYear || new Date().getFullYear()}, true, NOW())
      RETURNING *
    `;

    const newPlayer = newPlayers[0];

    // Return the new player with empty matches and stats
    const playerWithStats = {
      id: newPlayer.id,
      name: newPlayer.name,
      startYear: newPlayer.start_year,
      createdAt: new Date(newPlayer.created_at).toISOString(),
      isActive: true,
      deletedAt: null,
      matches: [],
      lastGameDate: null,
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

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_token')?.value === 'true';
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    
    // Validation
    if (!body.id) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }
    
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name cannot be empty' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Find existing player
    const existingPlayers = await sql`SELECT * FROM players WHERE id = ${body.id}`;
    if (existingPlayers.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const current = existingPlayers[0];
    const newName = body.name !== undefined ? body.name.trim() : current.name;
    const newStartYear = body.startYear !== undefined ? body.startYear : current.start_year;

    let newIsActive = current.is_active !== false && current.deleted_at == null;
    let newDeletedAt = current.deleted_at;

    if (body.isActive !== undefined) {
      newIsActive = Boolean(body.isActive);
      newDeletedAt = newIsActive ? null : (current.deleted_at || new Date());
    }

    // Update player in database
    const updatedPlayers = await sql`
      UPDATE players 
      SET name = ${newName}, start_year = ${newStartYear || null}, is_active = ${newIsActive}, deleted_at = ${newDeletedAt}
      WHERE id = ${body.id}
      RETURNING *
    `;

    const updatedPlayer = updatedPlayers[0];

    // Return the updated player
    const playerWithStats = {
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      startYear: updatedPlayer.start_year,
      createdAt: new Date(updatedPlayer.created_at).toISOString(),
      isActive: updatedPlayer.is_active !== false && updatedPlayer.deleted_at == null,
      deletedAt: updatedPlayer.deleted_at ? new Date(updatedPlayer.deleted_at).toISOString() : null,
    };
    
    return NextResponse.json(playerWithStats);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_token')?.value === 'true';
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Verify player exists
    const existingPlayers = await sql`SELECT * FROM players WHERE id = ${id}`;
    if (existingPlayers.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if player has match history
    const playerMatches = await sql`
      SELECT id FROM matches 
      WHERE team_one_player_one_id = ${id} OR
            team_one_player_two_id = ${id} OR
            team_one_player_three_id = ${id} OR
            team_two_player_one_id = ${id} OR
            team_two_player_two_id = ${id} OR
            team_two_player_three_id = ${id}
      LIMIT 1
    `;

    if (playerMatches.length > 0) {
      // Mark inactive to preserve match integrity
      await sql`
        UPDATE players 
        SET is_active = false, deleted_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      // Safely delete unused player
      await sql`DELETE FROM players WHERE id = ${id}`;
    }

    // Clean up signups and availability entries for this player
    try {
      await sql`DELETE FROM weekly_signups WHERE player_id = ${id}`;
      await sql`DELETE FROM weekly_unavailable WHERE player_id = ${id}`;
    } catch {
      // Non-blocking in case tables don't exist in preview/test environments
    }

    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
