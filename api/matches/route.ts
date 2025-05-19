import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { matches, players } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all matches with player information
    const allMatches = await db.select().from(matches).orderBy(matches.date);
    
    // Fetch all players for name lookup
    const allPlayers = await db.select().from(players);
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    // Format matches with player names
    const formattedMatches = allMatches.map(match => {
      return {
        id: match.id,
        date: match.date,
        teamOnePlayers: [
          playerMap.get(match.teamOnePlayerA) || 'Unknown',
          match.teamOnePlayerB ? playerMap.get(match.teamOnePlayerB) || 'Unknown' : null
        ].filter(Boolean), // Filter out null values
        teamTwoPlayers: [
          playerMap.get(match.teamTwoPlayerA) || 'Unknown',
          match.teamTwoPlayerB ? playerMap.get(match.teamTwoPlayerB) || 'Unknown' : null
        ].filter(Boolean),
        teamOneGamesWon: match.teamOneGamesWon,
        teamTwoGamesWon: match.teamTwoGamesWon
      };
    });
    
    return NextResponse.json(formattedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.teamOnePlayerA || !body.teamTwoPlayerA || 
        body.teamOneGamesWon === undefined || body.teamTwoGamesWon === undefined) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }
    
    // Create match
    const newMatch = {
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
    
    const result = await db.insert(matches).values(newMatch).returning();
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}