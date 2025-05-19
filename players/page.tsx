'use client';

import { useState, useEffect } from 'react';
import { Player } from '../../../db/schema';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Players</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Player
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="text-xl">Loading players...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div key={player.id} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">{player.name}</h2>
              <p className="text-gray-600">
                Joined: {player.createdAt 
                  ? new Date(player.createdAt).toLocaleDateString() 
                  : 'Unknown'}
              </p>
              {player.startYear && (
                <p className="text-gray-600">Active since: {player.startYear}</p>
              )}
            </div>
          ))}

          {players.length === 0 && (
            <div className="col-span-full text-center p-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No players found. Add your first player to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}