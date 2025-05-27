'use client';

import { useState, useEffect } from 'react';
import { GameHistory } from '../components/GameHistory';

interface MatchResult {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export default function ResultsPage() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    // Fetch matches when component mounts
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      const response = await fetch('/api/matches');
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      setMatches(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
      alert('Error fetching match data. Please try again later.');
    }
  }

  // Filter matches based on search query and date range
  const filteredMatches = matches.filter(match => {
    const matchDate = new Date(match.date);
    const matchDateString = matchDate.toISOString().split('T')[0];
    
    const matchPlayers = [...match.teamOnePlayers, ...match.teamTwoPlayers].join(' ').toLowerCase();
    const searchMatch = matchPlayers.includes(searchQuery.toLowerCase());
    
    const dateMatch = 
      (!startDate || matchDateString >= startDate) && 
      (!endDate || matchDateString <= endDate);
    
    return searchMatch && dateMatch;
  });
  
  // Sort matches by date (newest first)
  const sortedMatches = [...filteredMatches].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Match Results</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search-players" className="block text-sm font-medium text-gray-700 mb-1">
            Search Players
          </label>
          <input
            id="search-players"
            type="text"
            placeholder="Search by player name..."
            className="w-full p-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Game History component */}
      <div className="bg-white rounded-lg shadow p-6">
        <GameHistory games={sortedMatches} />
      </div>
    </div>
  );
}