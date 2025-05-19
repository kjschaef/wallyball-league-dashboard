'use client';

import { useState, useEffect } from 'react';
import { Player } from '../../../db/schema';

export default function AnalyticsPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [playerStats, setPlayerStats] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }
        const data = await response.json();
        setPlayers(data);
        if (data.length > 0) {
          setSelectedPlayerId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayerId) {
      fetchPlayerStats(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  async function fetchPlayerStats(playerId: number) {
    try {
      setLoading(true);
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch player stats');
      }
      const data = await response.json();
      setPlayerStats(data);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Player Analytics</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="player-select" className="block mb-2 font-medium">
            Select Player
          </label>
          <select
            id="player-select"
            className="w-full p-2 border rounded-md"
            value={selectedPlayerId || ''}
            onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
            disabled={loading || players.length === 0}
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="text-xl">Loading analytics...</div>
          </div>
        ) : playerStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-1">Win Rate</h3>
                <div className="text-2xl font-bold">
                  {playerStats.stats?.won && playerStats.stats?.lost
                    ? `${Math.round(
                        (playerStats.stats.won /
                          (playerStats.stats.won + playerStats.stats.lost)) *
                          100
                      )}%`
                    : 'N/A'}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-1">Matches Won</h3>
                <div className="text-2xl font-bold">
                  {playerStats.stats?.won || 0}
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-800 mb-1">Matches Lost</h3>
                <div className="text-2xl font-bold">
                  {playerStats.stats?.lost || 0}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Recent Matches</h3>
              {playerStats.matches && playerStats.matches.length > 0 ? (
                <div className="space-y-2">
                  {playerStats.matches.slice(0, 5).map((match: any) => (
                    <div key={match.id} className="bg-gray-50 p-3 rounded-md flex justify-between">
                      <span>{new Date(match.date).toLocaleDateString()}</span>
                      <span className={match.won ? 'text-green-600' : 'text-red-600'}>
                        {match.won ? 'Won' : 'Lost'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No match history available.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-500">Select a player to view analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
}