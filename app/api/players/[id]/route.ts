import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { players, matches } from '../../../../../db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    // Get player details
    const player = await db
      .select()
      .from(players)
      .where(eq(players.id, id))
      .limit(1);

    if (player.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get player's matches
    const playerMatches = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.teamOnePlayerA, id),
          eq(matches.teamOnePlayerB, id),
          eq(matches.teamTwoPlayerA, id),
          eq(matches.teamTwoPlayerB, id)
        )
      )
      .orderBy(matches.date);

    // Process player stats
    const formattedMatches = playerMatches.map(match => {
      const isTeamOne = match.teamOnePlayerA === id || match.teamOnePlayerB === id;
      const won = isTeamOne 
        ? match.teamOneGamesWon > match.teamTwoGamesWon
        : match.teamTwoGamesWon > match.teamOneGamesWon;
      
      return {
        id: match.id,
        date: match.date,
        won,
        isTeamOne,
        teamOneGamesWon: match.teamOneGamesWon,
        teamTwoGamesWon: match.teamTwoGamesWon
      };
    });

    // Calculate stats
    const won = formattedMatches.filter(m => m.won).length;
    const lost = formattedMatches.filter(m => !m.won).length;
    const stats = {
      won,
      lost,
      totalGames: won + lost,
      totalMatchTime: 0 // This could be calculated if you have match duration data
    };

    return NextResponse.json({
      ...player[0],
      matches: formattedMatches,
      stats
    });
  } catch (error) {
    console.error('Error fetching player details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Basic validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const updateData = {
      name: body.name,
      startYear: body.startYear || null,
    };
    
    const result = await db
      .update(players)
      .set(updateData)
      .where(eq(players.id, id))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
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
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }
    
    // Check if player exists
    const player = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    
    if (player.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }
    
    // Delete player
    await db.delete(players).where(eq(players.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}