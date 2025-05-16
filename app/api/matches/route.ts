import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { matches, players } from "../../../db/schema";

export async function GET() {
  try {
    const allMatches = await db.select().from(matches);
    const allPlayers = await db.select().from(players);

    const matchesWithPlayerNames = allMatches.map((match) => ({
      ...match,
      teamOnePlayers: [
        match.teamOnePlayerOneId &&
          allPlayers.find((p) => p.id === match.teamOnePlayerOneId)?.name,
        match.teamOnePlayerTwoId &&
          allPlayers.find((p) => p.id === match.teamOnePlayerTwoId)?.name,
        match.teamOnePlayerThreeId &&
          allPlayers.find((p) => p.id === match.teamOnePlayerThreeId)?.name,
      ].filter(Boolean),
      teamTwoPlayers: [
        match.teamTwoPlayerOneId &&
          allPlayers.find((p) => p.id === match.teamTwoPlayerOneId)?.name,
        match.teamTwoPlayerTwoId &&
          allPlayers.find((p) => p.id === match.teamTwoPlayerTwoId)?.name,
        match.teamTwoPlayerThreeId &&
          allPlayers.find((p) => p.id === match.teamTwoPlayerThreeId)?.name,
      ].filter(Boolean),
    }));

    return NextResponse.json(matchesWithPlayerNames);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}