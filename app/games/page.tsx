'use client';

import React, { useState, useEffect } from 'react';

export default function GamesPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Array<{id: number; date: string; teamOnePlayers: string[]; teamTwoPlayers: string[]; teamOneGamesWon: number; teamTwoGamesWon: number}>>([]);

  useEffect(() => {
    // Fetch players when component mounts
    fetchRecentMatches();
  }, []);

  async function fetchRecentMatches() {
    try {
      const response = await fetch('/api/matches?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch recent matches');
      }
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
      alert('Error fetching recent matches. Please try again later.');
      // Set loading to false in case of error, so the page doesn't hang indefinitely.
      setLoading(false);
    }
  }

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  // It's important to set loading to false after matches are fetched (or an error occurs)
  // to prevent the loading spinner from showing indefinitely.
  // We can achieve this by modifying fetchRecentMatches to set loading to false.
  // Or, if fetchRecentMatches is guaranteed to be called only once on mount,
  // we can set loading to false in a .then() or .finally() block of the fetchRecentMatches promise in useEffect.
  // For simplicity, modifying fetchRecentMatches is more direct.
  // However, since fetchRecentMatches is already defined, let's adjust the useEffect.
  // No, it's better to set it in fetchRecentMatches as originally planned.
  // Let's also make sure loading is set to false in the success case of fetchRecentMatches.

  useEffect(() => {
    fetchRecentMatches().finally(() => setLoading(false));
  }, []);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Games</h1>

      {/* Recent Matches */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Matches</h2>
        
        {matches.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No recent matches found.
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="border rounded p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {formatDate(match.date)}
                  </span>
                  
                  <div className="text-xl font-bold">
                    {match.teamOneGamesWon} - {match.teamTwoGamesWon}
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Team 1</h4>
                    <p>{match.teamOnePlayers.join(' & ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Team 2</h4>
                    <p>{match.teamTwoPlayers.join(' & ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}