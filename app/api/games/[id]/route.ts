import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { matches } from "../../../../db/schema";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = parseInt(params.id);
    // deleting game id: server

    await db.delete(matches).where(eq(matches.id, gameId));

    // game deleted successfully
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 }
    );
  }
}
