import { NextResponse } from "next/server";
import { db } from "../../../db";
import { matches } from "../../../db/schema";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Recording new game:", data);
    
    const newGame = await db
      .insert(matches)
      .values({
        teamOnePlayerOneId: data.teamOnePlayerOneId,
        teamOnePlayerTwoId: data.teamOnePlayerTwoId,
        teamOnePlayerThreeId: data.teamOnePlayerThreeId,
        teamTwoPlayerOneId: data.teamTwoPlayerOneId,
        teamTwoPlayerTwoId: data.teamTwoPlayerTwoId,
        teamTwoPlayerThreeId: data.teamTwoPlayerThreeId,
        teamOneGamesWon: data.teamOneGamesWon,
        teamTwoGamesWon: data.teamTwoGamesWon,
        date: data.date ? new Date(data.date) : new Date(),
      })
      .returning();
      
    console.log("Game recorded:", newGame[0]);
    return NextResponse.json(newGame[0]);
  } catch (error) {
    console.error("Error recording game:", error);
    return NextResponse.json(
      { error: "Failed to record game" },
      { status: 500 }
    );
  }
}