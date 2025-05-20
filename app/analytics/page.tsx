'use client';

import { useState, useEffect } from 'react';
import { PerformanceTrend } from '../components/PerformanceTrend';
import { PlayerPerformanceRadar } from '../components/PlayerPerformanceRadar';
import { PlayerAchievements } from '../components/PlayerAchievements';

export default function AnalyticsPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch players when component mounts
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      setPlayers(data);
      
      // Set first player as default selected
      if (data.length > 0 && !selectedPlayer) {
        setSelectedPlayer(data[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
    }
  }

  async function fetchPlayerStats(playerId: number) {
    // This function would fetch detailed stats for a specific player
    // but for now we'll use the data we already have in the players array
    return players.find(p => p.id === playerId);
  }

  const handlePlayerChange = (playerId: number) => {
    setSelectedPlayer(playerId);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Player Analytics</h1>
        
        <div className="flex items-center space-x-4">
          <label htmlFor="player-select" className="font-medium">
            Select Player:
          </label>
          <select
            id="player-select"
            className="border rounded p-2"
            value={selectedPlayer || ''}
            onChange={(e) => handlePlayerChange(Number(e.target.value))}
          >
            <option value="">Select a player</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPlayer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Performance Trend</h2>
            <PerformanceTrend />
          </div>

          {/* Player Radar Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Performance Metrics</h2>
            <PlayerPerformanceRadar />
          </div>

          {/* Player Achievements */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Achievements</h2>
            <PlayerAchievements playerId={selectedPlayer} />
          </div>

          {/* Advanced Stats Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Advanced Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700">Win Rate</h3>
                <p className="text-2xl font-bold">45.2%</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Total Matches</h3>
                <p className="text-2xl font-bold">87</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Best Partner</h3>
                <p className="text-lg">Troy (62.5% win rate)</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Toughest Opponent</h3>
                <p className="text-lg">Nate (27.3% win rate)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}