import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { players, matches } from '../../../db/schema';
import { eq, or, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all players from database
    const allPlayers = await db.select().from(players);
    
    // Fetch all matches to calculate statistics
    const allMatches = await db.select().from(matches);
    
    // Process each player to include matches and statistics
    const playersWithStats = allPlayers.map(player => {
      // Find matches where this player participated
      const playerMatches = allMatches.filter(match => 
        match.teamOnePlayerOneId === player.id ||
        match.teamOnePlayerTwoId === player.id ||
        match.teamOnePlayerThreeId === player.id ||
        match.teamTwoPlayerOneId === player.id ||
        match.teamTwoPlayerTwoId === player.id ||
        match.teamTwoPlayerThreeId === player.id
      );
      
      // Process matches to determine wins/losses for this player
      const processedMatches = playerMatches.map(match => {
        const isTeamOne = match.teamOnePlayerOneId === player.id || 
                         match.teamOnePlayerTwoId === player.id || 
                         match.teamOnePlayerThreeId === player.id;
        
        const won = isTeamOne 
          ? match.teamOneGamesWon > match.teamTwoGamesWon
          : match.teamTwoGamesWon > match.teamOneGamesWon;
        
        return {
          id: match.id,
          date: match.date?.toISOString() || new Date().toISOString(),
          won,
          isTeamOne,
          teamOneGamesWon: match.teamOneGamesWon,
          teamTwoGamesWon: match.teamTwoGamesWon
        };
      });
      
      // Calculate statistics
      const won = processedMatches.filter(match => match.won).length;
      const lost = processedMatches.filter(match => !match.won).length;
      const totalGames = processedMatches.reduce((total, match) => 
        total + match.teamOneGamesWon + match.teamTwoGamesWon, 0
      );
      const totalMatchTime = processedMatches.length * 40; // Estimate 40 minutes per match
      
      return {
        id: player.id,
        name: player.name,
        startYear: player.startYear,
        createdAt: player.createdAt?.toISOString() || null,
        matches: processedMatches,
        stats: {
          won,
          lost,
          totalGames,
          totalMatchTime
        }
      };
    });
    
    return NextResponse.json(playersWithStats);
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
    
    // Validation
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Create new player in database
    const newPlayer = await db
      .insert(players)
      .values({
        name: body.name.trim(),
        startYear: body.startYear || new Date().getFullYear(),
        createdAt: new Date()
      })
      .returning();

    // Return the new player with empty matches and stats
    const playerWithStats = {
      id: newPlayer[0].id,
      name: newPlayer[0].name,
      startYear: newPlayer[0].startYear,
      createdAt: newPlayer[0].createdAt?.toISOString() || null,
      matches: [],
      stats: { won: 0, lost: 0, totalGames: 0, totalMatchTime: 0 }
    };
    
    return NextResponse.json(playerWithStats, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}