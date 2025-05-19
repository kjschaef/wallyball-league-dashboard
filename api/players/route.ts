import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { players } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allPlayers = await db.select().from(players);
    return NextResponse.json(allPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Create player with the current timestamp
    const newPlayer = {
      name: body.name,
      startYear: body.startYear || null,
      createdAt: new Date(),
    };
    
    const result = await db.insert(players).values(newPlayer).returning();
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}