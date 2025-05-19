'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch('/api/matches');
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        setMatches(data);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Match Results</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Record Match
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="text-xl">Loading match results...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">{new Date(match.date).toLocaleDateString()}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${match.teamOneGamesWon > match.teamTwoGamesWon ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <h3 className="font-medium mb-2">Team 1</h3>
                  <div className="mb-2">
                    {match.teamOnePlayers.join(', ')}
                  </div>
                  <div className="text-2xl font-bold">
                    {match.teamOneGamesWon}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${match.teamTwoGamesWon > match.teamOneGamesWon ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <h3 className="font-medium mb-2">Team 2</h3>
                  <div className="mb-2">
                    {match.teamTwoPlayers.join(', ')}
                  </div>
                  <div className="text-2xl font-bold">
                    {match.teamTwoGamesWon}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {matches.length === 0 && (
            <div className="text-center p-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No matches recorded yet. Record your first match to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}