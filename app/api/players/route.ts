import { NextResponse } from 'next/server';

// Mock data for fallback in case the API fetch fails
const mockPlayers = [
  {
    id: 1,
    name: 'Troy',
    startYear: 2020,
    createdAt: '2020-01-01T00:00:00Z',
    matches: Array(3).fill(null).map((_, i) => ({
      id: i + 1,
      date: new Date(2023, 4, i + 1).toISOString(),
      won: true,
      isTeamOne: true,
      teamOneGamesWon: 3,
      teamTwoGamesWon: 1,
    })),
    stats: { won: 3, lost: 0, totalGames: 12, totalMatchTime: 120 }
  },
  {
    id: 2,
    name: 'Nate',
    startYear: 2019,
    createdAt: '2019-01-01T00:00:00Z',
    matches: Array(25).fill(null).map((_, i) => ({
      id: i + 100,
      date: new Date(2023, 4, i + 1).toISOString(),
      won: i % 2 === 0,
      isTeamOne: i % 2 === 0,
      teamOneGamesWon: 2,
      teamTwoGamesWon: 3,
    })),
    stats: { won: 12, lost: 13, totalGames: 75, totalMatchTime: 750 }
  }
];

export async function GET() {
  try {
    // Server-side fetch from the original site
    const response = await fetch('https://cfa-wally-stats.replit.app/api/players', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' // Disable caching for now
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching players from original API:', error);
    // Return our mock data as fallback
    return NextResponse.json(mockPlayers);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Simple validation
  if (!body.name || body.name.trim() === '') {
    return NextResponse.json(
      { error: 'Player name is required' },
      { status: 400 }
    );
  }

  try {
    // Try to post to the original API
    const response = await fetch('https://cfa-wally-stats.replit.app/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error posting to original API:', error);
    
    // Return a mocked response
    const newPlayer = {
      id: Math.floor(Math.random() * 1000) + 10,
      name: body.name,
      startYear: body.startYear || new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      matches: [],
      stats: { won: 0, lost: 0, totalGames: 0, totalMatchTime: 0 }
    };
    
    return NextResponse.json(newPlayer, { status: 201 });
  }
}