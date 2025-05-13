import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/db';
import { players, matches } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDb();
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
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
