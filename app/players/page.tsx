'use client';

import { useState, useEffect } from 'react';
import { PlayerCard } from '../components/PlayerCard';

// Define Player interface
interface Player {
  id: number;
  name: string;
  startYear?: number | null;
  createdAt?: string | Date | null;
}

// Extended player with match stats
interface ExtendedPlayer extends Player {
  matches: Array<{ won: boolean, date: string }>;
  stats: { won: number, lost: number };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<ExtendedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerStartYear, setNewPlayerStartYear] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Fetch players when component mounts
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      // Fetch from the original API
      const response = await fetch('https://cfa-wally-stats.replit.app/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      
      setPlayers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
      // Show error state instead of mock data
      alert('Error fetching player data. Please try again later.');
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlayerName,
          startYear: newPlayerStartYear || null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add player');
      }
      
      // Refresh player list
      fetchPlayers();
      
      // Reset form
      setNewPlayerName('');
      setNewPlayerStartYear(undefined);
      setIsAddPlayerDialogOpen(false);
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player. Please try again.');
    }
  };

  const handleEditPlayer = async (player: Player) => {
    try {
      const response = await fetch(`/api/players/${player.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(player),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update player');
      }
      
      fetchPlayers(); // Refresh the list
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player. Please try again.');
    }
  };

  const handleDeletePlayer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete player');
      }
      
      fetchPlayers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player. Please try again.');
    }
  };

  // Filter players based on search query
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Players</h1>
        <button
          onClick={() => setIsAddPlayerDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add Player
        </button>
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search players..."
          className="w-full p-2 border rounded"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Player grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={handleEditPlayer}
            onDelete={handleDeletePlayer}
          />
        ))}
        
        {filteredPlayers.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No players found. Add a new player to get started.
          </div>
        )}
      </div>

      {/* Add Player Dialog */}
      {isAddPlayerDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Player</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Year (optional)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={newPlayerStartYear || ''}
                  onChange={(e) => setNewPlayerStartYear(e.target.value ? parseInt(e.target.value) : undefined)}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                onClick={() => setIsAddPlayerDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleAddPlayer}
              >
                Add Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}