import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { players, matches } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const playerId = parseInt(params.id);

  if (isNaN(playerId)) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  try {
    // Fetch the specific player
    const player = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    
    if (player.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Fetch all matches to find this player's matches
    const allMatches = await db.select().from(matches);
    
    // Find matches where this player participated
    const playerMatches = allMatches.filter(match => 
      match.teamOnePlayerOneId === playerId ||
      match.teamOnePlayerTwoId === playerId ||
      match.teamOnePlayerThreeId === playerId ||
      match.teamTwoPlayerOneId === playerId ||
      match.teamTwoPlayerTwoId === playerId ||
      match.teamTwoPlayerThreeId === playerId
    );
    
    // Process matches to determine wins/losses for this player
    const processedMatches = playerMatches.map(match => {
      const isTeamOne = match.teamOnePlayerOneId === playerId || 
                       match.teamOnePlayerTwoId === playerId || 
                       match.teamOnePlayerThreeId === playerId;
      
      const won = isTeamOne 
        ? match.teamOneGamesWon > match.teamTwoGamesWon
        : match.teamTwoGamesWon > match.teamOneGamesWon;
      
      return {
        id: match.id,
        date: match.date?.toISOString() || new Date().toISOString(),
        won,
        isTeamOne,
        teamOneGamesWon: match.teamOneGamesWon,
        teamTwoGamesWon: match.teamTwoGamesWon
      };
    });
    
    // Calculate statistics
    const won = processedMatches.filter(match => match.won).length;
    const lost = processedMatches.filter(match => !match.won).length;
    const totalGames = processedMatches.reduce((total, match) => 
      total + match.teamOneGamesWon + match.teamTwoGamesWon, 0
    );
    const totalMatchTime = processedMatches.length * 40; // Estimate 40 minutes per match
    
    const playerWithStats = {
      id: player[0].id,
      name: player[0].name,
      startYear: player[0].startYear,
      createdAt: player[0].createdAt?.toISOString() || null,
      matches: processedMatches,
      stats: {
        won,
        lost,
        totalGames,
        totalMatchTime
      }
    };

    return NextResponse.json(playerWithStats);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const playerId = parseInt(params.id);
  
  if (isNaN(playerId)) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    
    // Validation
    if (body.name && body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name cannot be empty' },
        { status: 400 }
      );
    }

    // Check if player exists
    const existingPlayer = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    
    if (existingPlayer.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Update player in database
    const updatedPlayer = await db
      .update(players)
      .set({
        name: body.name?.trim() || existingPlayer[0].name,
        startYear: body.startYear !== undefined ? body.startYear : existingPlayer[0].startYear
      })
      .where(eq(players.id, playerId))
      .returning();

    return NextResponse.json(updatedPlayer[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const playerId = parseInt(params.id);

  if (isNaN(playerId)) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  try {
    // Check if player exists
    const existingPlayer = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    
    if (existingPlayer.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Delete all matches involving this player first (to maintain referential integrity)
    await db.delete(matches).where(
      eq(matches.teamOnePlayerOneId, playerId)
    );
    await db.delete(matches).where(
      eq(matches.teamOnePlayerTwoId, playerId)
    );
    await db.delete(matches).where(
      eq(matches.teamOnePlayerThreeId, playerId)
    );
    await db.delete(matches).where(
      eq(matches.teamTwoPlayerOneId, playerId)
    );
    await db.delete(matches).where(
      eq(matches.teamTwoPlayerTwoId, playerId)
    );
    await db.delete(matches).where(
      eq(matches.teamTwoPlayerThreeId, playerId)
    );

    // Delete the player
    await db.delete(players).where(eq(players.id, playerId));

    // Return 204 No Content as per API documentation
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}