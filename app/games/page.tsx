'use client';

import { useState, useEffect } from 'react';
import { PlayerSelector } from '../components/PlayerSelector';

// Define Player interface
interface Player {
  id: number;
  name: string;
}

export default function GamesPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamOnePlayers, setTeamOnePlayers] = useState<number[]>([]);
  const [teamTwoPlayers, setTeamTwoPlayers] = useState<number[]>([]);
  const [teamOneScore, setTeamOneScore] = useState<number>(0);
  const [teamTwoScore, setTeamTwoScore] = useState<number>(0);
  const [matches, setMatches] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch players when component mounts
    fetchPlayers();
    fetchRecentMatches();
  }, []);

  async function fetchPlayers() {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      setPlayers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
      alert('Error fetching player data. Please try again later.');
    }
  }

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
    }
  }

  const handleTeamOnePlayerSelect = (playerId: number) => {
    // Don't allow the same player on both teams
    if (teamTwoPlayers.includes(playerId)) {
      return;
    }
    
    // Add to team one or remove if already selected
    if (teamOnePlayers.includes(playerId)) {
      setTeamOnePlayers(teamOnePlayers.filter(id => id !== playerId));
    } else {
      setTeamOnePlayers([...teamOnePlayers, playerId]);
    }
  };

  const handleTeamTwoPlayerSelect = (playerId: number) => {
    // Don't allow the same player on both teams
    if (teamOnePlayers.includes(playerId)) {
      return;
    }
    
    // Add to team two or remove if already selected
    if (teamTwoPlayers.includes(playerId)) {
      setTeamTwoPlayers(teamTwoPlayers.filter(id => id !== playerId));
    } else {
      setTeamTwoPlayers([...teamTwoPlayers, playerId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validation
    if (teamOnePlayers.length === 0 || teamTwoPlayers.length === 0) {
      setFormError('Both teams need at least one player');
      return;
    }
    
    if (teamOneScore === 0 && teamTwoScore === 0) {
      setFormError('At least one team needs to have a score');
      return;
    }
    
    // Create match data
    const matchData = {
      teamOnePlayers,
      teamTwoPlayers,
      teamOneGamesWon: teamOneScore,
      teamTwoGamesWon: teamTwoScore,
      date: new Date().toISOString()
    };
    
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to record match');
      }
      
      // Reset form
      setTeamOnePlayers([]);
      setTeamTwoPlayers([]);
      setTeamOneScore(0);
      setTeamTwoScore(0);
      
      // Refresh recent matches
      fetchRecentMatches();
      
      alert('Match recorded successfully!');
    } catch (error) {
      console.error('Error recording match:', error);
      setFormError('Failed to record match. Please try again.');
    }
  };

  // Get player names by IDs
  const getPlayerName = (id: number) => {
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown';
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Record Game</h1>

      {/* Game Recording Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">New Match</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team One */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Team 1</h3>
              <PlayerSelector
                players={players}
                selectedPlayers={teamOnePlayers}
                onSelect={handleTeamOnePlayerSelect}
                maxPlayers={2}
              />
              
              <div>
                <label htmlFor="team1-score" className="block text-sm font-medium text-gray-700 mb-1">
                  Games Won
                </label>
                <input
                  id="team1-score"
                  type="number"
                  min="0"
                  max="5"
                  className="w-full p-2 border rounded"
                  value={teamOneScore}
                  onChange={(e) => setTeamOneScore(parseInt(e.target.value))}
                />
              </div>
            </div>
            
            {/* Team Two */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Team 2</h3>
              <PlayerSelector
                players={players}
                selectedPlayers={teamTwoPlayers}
                onSelect={handleTeamTwoPlayerSelect}
                maxPlayers={2}
              />
              
              <div>
                <label htmlFor="team2-score" className="block text-sm font-medium text-gray-700 mb-1">
                  Games Won
                </label>
                <input
                  id="team2-score"
                  type="number"
                  min="0"
                  max="5"
                  className="w-full p-2 border rounded"
                  value={teamTwoScore}
                  onChange={(e) => setTeamTwoScore(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          {/* Error message */}
          {formError && (
            <div className="text-red-500 text-sm">{formError}</div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Record Match
            </button>
          </div>
        </form>
      </div>

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