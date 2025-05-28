import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { matches, players } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  
  try {
    // Fetch matches from database
    let allMatches;
    
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        allMatches = await db.select().from(matches).orderBy(desc(matches.date)).limit(limitNum);
      } else {
        allMatches = await db.select().from(matches).orderBy(desc(matches.date));
      }
    } else {
      allMatches = await db.select().from(matches).orderBy(desc(matches.date));
    }
    
    // Get all players to map IDs to names
    const allPlayers = await db.select().from(players);
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    // Process matches to include player names
    const processedMatches = allMatches.map(match => {
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
      
      return {
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
    });
    
    return NextResponse.json(processedMatches);
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
    
    // Validation for the documented API format
    if (body.teamOnePlayerOneId === undefined || body.teamTwoPlayerOneId === undefined) {
      return NextResponse.json(
        { error: 'At least one player per team is required' },
        { status: 400 }
      );
    }

    if (body.teamOneGamesWon === undefined || body.teamTwoGamesWon === undefined) {
      return NextResponse.json(
        { error: 'Game scores are required' },
        { status: 400 }
      );
    }

    // Create new match in database
    const newMatch = await db
      .insert(matches)
      .values({
        teamOnePlayerOneId: body.teamOnePlayerOneId,
        teamOnePlayerTwoId: body.teamOnePlayerTwoId || null,
        teamOnePlayerThreeId: body.teamOnePlayerThreeId || null,
        teamTwoPlayerOneId: body.teamTwoPlayerOneId,
        teamTwoPlayerTwoId: body.teamTwoPlayerTwoId || null,
        teamTwoPlayerThreeId: body.teamTwoPlayerThreeId || null,
        teamOneGamesWon: body.teamOneGamesWon,
        teamTwoGamesWon: body.teamTwoGamesWon,
        date: body.date ? new Date(body.date) : new Date()
      })
      .returning();

    // Get player names for the response
    const allPlayers = await db.select().from(players);
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    const match = newMatch[0];
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
    
    return NextResponse.json(responseMatch, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}