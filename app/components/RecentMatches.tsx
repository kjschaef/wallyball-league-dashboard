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
        const response = await fetch('/api/matches?limit=10');
        if (!response.ok) {
          throw new Error('Failed to fetch recent matches');
        }
        const data = await response.json();
        
        // Filter to only show matches from the last day
        const lastDayMatches = filterLastDayMatches(data);
        setMatches(lastDayMatches);
      } catch (error) {
        console.error('Error fetching recent matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMatches();
  }, []);

  // Filter matches to only include those from the last 24 hours
  const filterLastDayMatches = (matches: Match[]): Match[] => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    return matches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate >= yesterday;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <p>Loading recent matches...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-gray-800">Today's Matches</h2>
        <div className="text-center py-4 text-gray-500">
          No matches found in the last 24 hours.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-gray-800">Today's Matches</h2>
      <GameHistory games={matches} />
    </div>
  );
}