import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { players, matches } from '../../../../db/schema';
import { eq, or } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const playerId = parseInt(params.id);
    console.log("Updating player:", playerId);
    
    const body = await request.json();

    const updatedPlayer = await db
      .update(players)
      .set({ 
        name: body.name,
        startYear: body.startYear 
      })
      .where(eq(players.id, playerId))
      .returning();

    if (updatedPlayer.length === 0) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    console.log("Player updated:", updatedPlayer[0]);
    return NextResponse.json(updatedPlayer[0]);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const playerId = parseInt(params.id);
    console.log("Deleting player:", playerId);

    await db.delete(matches).where(
      or(
        eq(matches.teamOnePlayerOneId, playerId),
        eq(matches.teamOnePlayerTwoId, playerId),
        eq(matches.teamOnePlayerThreeId, playerId),
        eq(matches.teamTwoPlayerOneId, playerId),
        eq(matches.teamTwoPlayerTwoId, playerId),
        eq(matches.teamTwoPlayerThreeId, playerId)
      )
    );

    await db.delete(players).where(eq(players.id, playerId));

    console.log("Player and associated games deleted successfully");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
  }
}
