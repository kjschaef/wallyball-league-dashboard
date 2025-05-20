'use client';

import { useState, useEffect } from 'react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

// Mock achievements data for visualization
const mockAchievements: Achievement[] = [
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
    unlockedAt: '2023-04-20T09:12:45Z'
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

export function PlayerAchievements({ playerId, compact = false }: { playerId: number; compact?: boolean }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch achievements from the API
    // For demonstration, using mock data
    fetchAchievements(playerId);
  }, [playerId]);

  async function fetchAchievements(playerId: number) {
    try {
      const response = await fetch(`/api/achievements/player/${playerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      const data = await response.json();
      setAchievements(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fall back to mock data to ensure UI isn't empty
      setAchievements(mockAchievements);
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading achievements...</div>;
  }

  // Show unlocked achievements first, then locked ones
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    if (a.unlockedAt && b.unlockedAt) {
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    }
    return 0;
  });

  if (compact) {
    // Compact view for smaller spaces (e.g. profile cards)
    return (
      <div className="flex flex-wrap gap-2">
        {sortedAchievements.slice(0, 4).map((achievement) => (
          <div 
            key={achievement.id}
            className={`rounded-full p-2 text-xl ${achievement.unlockedAt ? 'bg-blue-100' : 'bg-gray-200 opacity-50'}`}
            title={achievement.name}
          >
            {achievement.icon}
          </div>
        ))}
        {achievements.length > 4 && (
          <div className="rounded-full p-2 bg-gray-100 text-xs flex items-center justify-center">
            +{achievements.length - 4}
          </div>
        )}
      </div>
    );
  }
  
  // Full view with details
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sortedAchievements.map((achievement) => (
        <div 
          key={achievement.id} 
          className={`flex p-3 rounded-lg ${
            achievement.unlockedAt 
              ? 'bg-blue-50 border border-blue-100' 
              : 'bg-gray-50 border border-gray-100 opacity-70'
          }`}
        >
          <div className="text-2xl mr-3">{achievement.icon}</div>
          <div>
            <h3 className="font-semibold">{achievement.name}</h3>
            <p className="text-sm text-gray-600">{achievement.description}</p>
            {achievement.unlockedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}