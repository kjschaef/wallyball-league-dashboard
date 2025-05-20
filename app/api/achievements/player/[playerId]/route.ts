import { NextResponse } from 'next/server';

// Mock achievements data based on player ID
const getMockAchievements = (playerId: number) => {
  // Common achievements for all players
  const commonAchievements = [
    {
      id: 1,
      name: 'First Victory',
      description: 'Win your first match',
      icon: '🏆',
      unlockedAt: '2023-01-15T12:34:56Z'
    },
    {
      id: 5,
      name: 'Comeback King',
      description: 'Win a match after being down by 5 points',
      icon: '👑',
      unlockedAt: null
    },
    {
      id: 6,
      name: 'Perfect Game',
      description: 'Win a game without losing a point',
      icon: '💯',
      unlockedAt: null
    }
  ];
  
  // Player-specific achievements
  const playerAchievements: { [key: number]: Array<any> } = {
    1: [ // Troy
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
      }
    ],
    2: [ // Nate
      {
        id: 4,
        name: 'Veteran',
        description: 'Play 50 matches',
        icon: '🎖️',
        unlockedAt: '2023-04-20T09:12:45Z'
      },
      {
        id: 7,
        name: 'Dominant',
        description: 'Win 5 matches in a row',
        icon: '🏅',
        unlockedAt: '2023-05-01T16:45:12Z'
      }
    ],
    3: [ // Lance
      {
        id: 3,
        name: 'Team Player',
        description: 'Play with 5 different teammates',
        icon: '👥',
        unlockedAt: '2023-03-15T10:12:33Z'
      }
    ],
    4: [ // Shortt
      {
        id: 4,
        name: 'Veteran',
        description: 'Play 50 matches',
        icon: '🎖️',
        unlockedAt: '2023-04-10T14:22:45Z'
      }
    ],
    5: [ // Vamsi
      {
        id: 8,
        name: 'Underdog',
        description: 'Win against a player with a higher win rate',
        icon: '🐶',
        unlockedAt: '2023-05-05T11:32:21Z'
      }
    ]
  };
  
  // Combine common and player-specific achievements
  return [
    ...commonAchievements,
    ...(playerAchievements[playerId] || [])
  ];
};

export async function GET(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  const playerId = parseInt(params.playerId);

  if (isNaN(playerId)) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  // Get player-specific achievements
  const achievements = getMockAchievements(playerId);

  return NextResponse.json(achievements);
}