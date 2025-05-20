import { NextResponse } from 'next/server';

// Mock match data as fallback in case the API fetch fails
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
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  
  try {
    // Server-side fetch from the original site
    let url = 'https://cfa-wally-stats.replit.app/api/matches';
    
    // If limit parameter is provided, pass it along
    if (limit) {
      url += `?limit=${limit}`;
    }
    
    const response = await fetch(url, {
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
    console.error('Error fetching matches from original API:', error);
    
    // Apply filtering to mock data based on the request
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
    
    // Return our mock data as fallback
    return NextResponse.json(matches);
  }
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

  try {
    // Try to post to the original API
    const response = await fetch('https://cfa-wally-stats.replit.app/api/matches', {
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
    const newMatch = {
      id: Math.floor(Math.random() * 1000) + 10,
      date: body.date || new Date().toISOString(),
      teamOnePlayers: body.teamOnePlayers,
      teamTwoPlayers: body.teamTwoPlayers,
      teamOneGamesWon: body.teamOneGamesWon,
      teamTwoGamesWon: body.teamTwoGamesWon
    };
    
    return NextResponse.json(newMatch, { status: 201 });
  }
}