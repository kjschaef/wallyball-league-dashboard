'use client';

import { useState, useEffect } from 'react';
import { GameHistory } from './GameHistory';

interface Match {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export function RecentMatches() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchRecentMatches = async () => {
      try {
        const response = await fetch('/api/matches?limit=5');
        if (!response.ok) {
          throw new Error('Failed to fetch recent matches');
        }
        const data = await response.json();
        setMatches(data);
      } catch (error) {
        console.error('Error fetching recent matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <p>Loading recent matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-gray-800">Recent Matches</h2>
      <GameHistory games={matches} />
    </div>
  );
}