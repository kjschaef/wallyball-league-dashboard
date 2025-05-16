import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "../../../../db";
import { players, matches } from "../../../../db/schema";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = parseInt(params.id);
    console.log("Updating player:", playerId);
    
    const data = await request.json();

    // Update name and startYear fields
    const updatedPlayer = await db
      .update(players)
      .set({ 
        name: data.name,
        startYear: data.startYear 
      })
      .where(eq(players.id, playerId))
      .returning();

    if (updatedPlayer.length === 0) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    console.log("Player updated:", updatedPlayer[0]);
    return NextResponse.json(updatedPlayer[0]);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = parseInt(params.id);
    console.log("Deleting player:", playerId);

    // First, delete all games associated with this player
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

    // Then delete the player
    await db.delete(players).where(eq(players.id, playerId));

    console.log("Player and associated games deleted successfully");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}