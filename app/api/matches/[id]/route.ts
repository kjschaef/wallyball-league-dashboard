import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { matches, players } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    // Get match details
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, id))
      .limit(1);

    if (match.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    // Get player names
    const playerIds = [
      match[0].teamOnePlayerA,
      match[0].teamOnePlayerB,
      match[0].teamTwoPlayerA,
      match[0].teamTwoPlayerB
    ].filter(Boolean);
    
    const playerRecords = await db
      .select()
      .from(players)
      .where(
        playerIds.length > 0 
          ? eq(players.id, playerIds[0]) 
          : undefined
      );
      
    const playerMap = new Map(playerRecords.map(p => [p.id, p.name]));
    
    // Format match with player names
    const formattedMatch = {
      ...match[0],
      teamOnePlayers: [
        playerMap.get(match[0].teamOnePlayerA) || 'Unknown',
        match[0].teamOnePlayerB ? playerMap.get(match[0].teamOnePlayerB) || 'Unknown' : null
      ].filter(Boolean),
      teamTwoPlayers: [
        playerMap.get(match[0].teamTwoPlayerA) || 'Unknown',
        match[0].teamTwoPlayerB ? playerMap.get(match[0].teamTwoPlayerB) || 'Unknown' : null
      ].filter(Boolean)
    };

    return NextResponse.json(formattedMatch);
  } catch (error) {
    console.error('Error fetching match details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match details' },
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
        { error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Basic validation
    if (!body.teamOnePlayerA || !body.teamTwoPlayerA || 
        body.teamOneGamesWon === undefined || body.teamTwoGamesWon === undefined) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }
    
    const updateData = {
      date: body.date || new Date().toISOString(),
      teamOnePlayerA: body.teamOnePlayerA,
      teamOnePlayerB: body.teamOnePlayerB || null,
      teamTwoPlayerA: body.teamTwoPlayerA,
      teamTwoPlayerB: body.teamTwoPlayerB || null,
      teamOneGamesWon: body.teamOneGamesWon,
      teamTwoGamesWon: body.teamTwoGamesWon,
      startTime: body.startTime || null,
      endTime: body.endTime || null
    };
    
    const result = await db
      .update(matches)
      .set(updateData)
      .where(eq(matches.id, id))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
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
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
      );
    }
    
    // Check if match exists
    const match = await db
      .select({ id: matches.id })
      .from(matches)
      .where(eq(matches.id, id))
      .limit(1);
    
    if (match.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    // Delete match
    await db.delete(matches).where(eq(matches.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}