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
        
        // Filter to only show matches from the most recent day with games
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

  // Filter matches to only include those from the most recent day with games
  const filterLastDayMatches = (matches: Match[]): Match[] => {
    if (matches.length === 0) return [];
    
    // Sort matches by date (most recent first)
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Get the most recent date
    const mostRecentDate = new Date(sortedMatches[0].date).toDateString();
    
    // Return all matches from that most recent day
    return sortedMatches.filter(match => 
      new Date(match.date).toDateString() === mostRecentDate
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <p>Loading recent matches...</p>
      </div>
    );
  }

  // Get the date of the matches for the title
  const matchDate = matches.length > 0 ? new Date(matches[0].date) : null;
  const titleDate = matchDate ? matchDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '';

  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-gray-800">Recent Matches</h2>
        <div className="text-center py-4 text-gray-500">
          No matches found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-gray-800">
        Last Games Played - {titleDate}
      </h2>
      <GameHistory games={matches} />
    </div>
  );
}