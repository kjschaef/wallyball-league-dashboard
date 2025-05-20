import { NextResponse } from 'next/server';

// Mock match data - in a real app this would come from a database
const mockMatches = [
  {
    id: 1,
    date: '2023-05-10T18:30:00Z',
    teamOnePlayers: ['Troy', 'Nate'],
    teamTwoPlayers: ['Lance', 'Shortt'],
    teamOneGamesWon: 3,
    teamTwoGamesWon: 1
  },
  {
    id: 2,
    date: '2023-05-05T19:00:00Z',
    teamOnePlayers: ['Vamsi', 'Keith'],
    teamTwoPlayers: ['Relly', 'Trevor'],
    teamOneGamesWon: 2,
    teamTwoGamesWon: 3
  },
  {
    id: 3,
    date: '2023-04-28T18:00:00Z',
    teamOnePlayers: ['Prarie', 'Zach'],
    teamTwoPlayers: ['Ambree', 'Smathers'],
    teamOneGamesWon: 3,
    teamTwoGamesWon: 2
  },
  {
    id: 4,
    date: '2023-04-20T17:30:00Z',
    teamOnePlayers: ['Seth J.', 'Andrew Jarrett'],
    teamTwoPlayers: ['Jonathan J.', 'Donna Rolt'],
    teamOneGamesWon: 1,
    teamTwoGamesWon: 3
  },
  {
    id: 5,
    date: '2023-04-15T18:30:00Z',
    teamOnePlayers: ['Troy', 'Lance'],
    teamTwoPlayers: ['Nate', 'Shortt'],
    teamOneGamesWon: 2,
    teamTwoGamesWon: 3
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  
  let matches = [...mockMatches];
  
  // Sort by date (newest first)
  matches.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Apply limit if provided
  if (limit) {
    const limitNum = parseInt(limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      matches = matches.slice(0, limitNum);
    }
  }
  
  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Simple validation
  if (!body.teamOnePlayers || !body.teamTwoPlayers) {
    return NextResponse.json(
      { error: 'Team players are required' },
      { status: 400 }
    );
  }

  if (body.teamOneGamesWon === undefined || body.teamTwoGamesWon === undefined) {
    return NextResponse.json(
      { error: 'Game scores are required' },
      { status: 400 }
    );
  }

  // Create a new match
  const newMatch = {
    id: mockMatches.length + 1,
    date: body.date || new Date().toISOString(),
    teamOnePlayers: body.teamOnePlayers,
    teamTwoPlayers: body.teamTwoPlayers,
    teamOneGamesWon: body.teamOneGamesWon,
    teamTwoGamesWon: body.teamTwoGamesWon
  };

  // In a real app, this would be saved to a database
  // For this demo, we'll just return the new match
  
  return NextResponse.json(newMatch, { status: 201 });
}