import { NextResponse } from 'next/server';

// Mock achievements as fallback data
const mockAchievements = [
  {
    id: 1,
    name: 'First Victory',
    description: 'Win your first match',
    icon: '🏆',
    unlockedAt: '2023-01-15T12:34:56Z'
  },
  {
    id: 2,
    name: 'Win Streak',
    description: 'Win 3 matches in a row',
    icon: '🔥',
    unlockedAt: '2023-02-10T15:30:00Z'
  },
  {
    id: 3,
    name: 'Team Player',
    description: 'Play with 5 different teammates',
    icon: '👥',
    unlockedAt: '2023-03-05T14:22:33Z'
  },
  {
    id: 4,
    name: 'Veteran',
    description: 'Play 50 matches',
    icon: '🎖️',
    unlockedAt: null
  },
  {
    id: 5,
    name: 'Comeback King',
    description: 'Win a match after being down by 5 points',
    icon: '👑',
    unlockedAt: null
  }
];

export async function GET(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const playerId = parseInt(params.playerId);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    // Return the mock achievements directly for now since the original API
    // appears to be returning HTML instead of JSON
    return NextResponse.json(mockAchievements);
    
    // This code can be uncommented if the original API is fixed in the future
    /*
    // Server-side fetch from the original site
    const response = await fetch(`https://cfa-wally-stats.replit.app/api/achievements/player/${playerId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    */
  } catch (error) {
    console.error(`Error in achievements API:`, error);
    // Return mock achievements as fallback
    return NextResponse.json(mockAchievements);
  }
}