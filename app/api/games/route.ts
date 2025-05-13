import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/db';
import { matches } from '../../../db/schema';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    console.log("Recording new game:", body);
    
    const newMatch = await db.insert(matches).values({
      teamOnePlayerOneId: body.teamOnePlayerOneId || null,
      teamOnePlayerTwoId: body.teamOnePlayerTwoId || null,
      teamOnePlayerThreeId: body.teamOnePlayerThreeId || null,
      teamTwoPlayerOneId: body.teamTwoPlayerOneId || null,
      teamTwoPlayerTwoId: body.teamTwoPlayerTwoId || null,
      teamTwoPlayerThreeId: body.teamTwoPlayerThreeId || null,
      teamOneGamesWon: body.teamOneGamesWon,
      teamTwoGamesWon: body.teamTwoGamesWon,
      date: new Date(body.date),
    }).returning();
    
    console.log("Game recorded:", newMatch[0]);
    return NextResponse.json(newMatch[0]);
  } catch (error) {
    console.error("Error recording game:", error);
    return NextResponse.json({ error: "Failed to record game" }, { status: 500 });
  }
}
