import { NextResponse } from "next/server";
import { db } from "../../../db";
import { matches, players } from "../../../db/schema";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Recording new game:", data);
    
    // Validation
    if (data.teamOnePlayerOneId === undefined || data.teamTwoPlayerOneId === undefined) {
      return NextResponse.json(
        { error: 'At least one player per team is required' },
        { status: 400 }
      );
    }

    if (data.teamOneGamesWon === undefined || data.teamTwoGamesWon === undefined) {
      return NextResponse.json(
        { error: 'Game scores are required' },
        { status: 400 }
      );
    }
    
    const newGame = await db
      .insert(matches)
      .values({
        teamOnePlayerOneId: data.teamOnePlayerOneId,
        teamOnePlayerTwoId: data.teamOnePlayerTwoId || null,
        teamOnePlayerThreeId: data.teamOnePlayerThreeId || null,
        teamTwoPlayerOneId: data.teamTwoPlayerOneId,
        teamTwoPlayerTwoId: data.teamTwoPlayerTwoId || null,
        teamTwoPlayerThreeId: data.teamTwoPlayerThreeId || null,
        teamOneGamesWon: data.teamOneGamesWon,
        teamTwoGamesWon: data.teamTwoGamesWon,
        date: data.date ? new Date(data.date) : new Date(),
      })
      .returning();

    // Get player names for the response (matching the documented format)
    const allPlayers = await db.select().from(players);
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    const match = newGame[0];
    const teamOnePlayers = [
      match.teamOnePlayerOneId && playerMap.get(match.teamOnePlayerOneId),
      match.teamOnePlayerTwoId && playerMap.get(match.teamOnePlayerTwoId),
      match.teamOnePlayerThreeId && playerMap.get(match.teamOnePlayerThreeId)
    ].filter(Boolean);
    
    const teamTwoPlayers = [
      match.teamTwoPlayerOneId && playerMap.get(match.teamTwoPlayerOneId),
      match.teamTwoPlayerTwoId && playerMap.get(match.teamTwoPlayerTwoId),
      match.teamTwoPlayerThreeId && playerMap.get(match.teamTwoPlayerThreeId)
    ].filter(Boolean);
    
    const responseMatch = {
      id: match.id,
      teamOnePlayerOneId: match.teamOnePlayerOneId,
      teamOnePlayerTwoId: match.teamOnePlayerTwoId,
      teamOnePlayerThreeId: match.teamOnePlayerThreeId,
      teamTwoPlayerOneId: match.teamTwoPlayerOneId,
      teamTwoPlayerTwoId: match.teamTwoPlayerTwoId,
      teamTwoPlayerThreeId: match.teamTwoPlayerThreeId,
      teamOneGamesWon: match.teamOneGamesWon,
      teamTwoGamesWon: match.teamTwoGamesWon,
      date: match.date?.toISOString() || new Date().toISOString(),
      teamOnePlayers,
      teamTwoPlayers
    };
      
    console.log("Game recorded:", responseMatch);
    return NextResponse.json(responseMatch, { status: 201 });
  } catch (error) {
    console.error("Error recording game:", error);
    return NextResponse.json(
      { error: "Failed to record game" },
      { status: 500 }
    );
  }
}