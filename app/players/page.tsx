'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '../components/AdminProvider';
import { PlayerCard } from '../components/PlayerCard';

// Define Player interface
interface Player {
  id: number;
  name: string;
  startYear?: number | null;
  phoneNumber?: string | null;
  smsOptIn?: boolean | null;
  createdAt?: string | Date | null;
}

// Extended player with match stats
interface ExtendedPlayer extends Player {
  matches: Array<{ won: boolean, date: string }>;
  stats: { won: number, lost: number };
}

interface PlayerMutationPayload {
  name: string;
  startYear: number | null;
  phoneNumber: string | null;
  smsOptIn: boolean;
}



export default function PlayersPage() {
  const [players, setPlayers] = useState<ExtendedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerStartYear, setNewPlayerStartYear] = useState<number | undefined>(undefined);
  const [newPlayerPhoneNumber, setNewPlayerPhoneNumber] = useState('');
  const [newPlayerSmsOptIn, setNewPlayerSmsOptIn] = useState(false);
  const { requireAdmin } = useAdmin();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editedPlayerName, setEditedPlayerName] = useState('');
  const [editedPlayerStartYear, setEditedPlayerStartYear] = useState('');
  const [editedPlayerPhoneNumber, setEditedPlayerPhoneNumber] = useState('');
  const [editedPlayerSmsOptIn, setEditedPlayerSmsOptIn] = useState(false);

  useEffect(() => {
    void fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      // Use our own API endpoint which forwards to the original site
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

  async function createPlayer(player: PlayerMutationPayload) {
    return fetch('/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(player),
    });
  }

  async function updatePlayer(playerId: number, player: PlayerMutationPayload) {
    return fetch(`/api/players/${playerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: playerId,
        ...player,
      }),
    });
  }

  async function deletePlayer(playerId: number) {
    return fetch(`/api/players/${playerId}`, {
      method: 'DELETE',
    });
  }



  const closeEditPlayerDialog = () => {
    setEditingPlayer(null);
    setEditedPlayerName('');
    setEditedPlayerStartYear('');
    setEditedPlayerPhoneNumber('');
    setEditedPlayerSmsOptIn(false);
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditedPlayerName(player.name);
    setEditedPlayerStartYear(player.startYear?.toString() || '');
    setEditedPlayerPhoneNumber(player.phoneNumber || '');
    setEditedPlayerSmsOptIn(!!player.smsOptIn);
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    const payload = {
      name: newPlayerName.trim(),
      startYear: newPlayerStartYear || null,
      phoneNumber: newPlayerPhoneNumber.trim() || null,
      smsOptIn: newPlayerSmsOptIn,
    };

    const submit = async () => {
      const response = await createPlayer(payload);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add player');
      }

      await response.json();
      await fetchPlayers();
      setNewPlayerName('');
      setNewPlayerStartYear(undefined);
      setNewPlayerPhoneNumber('');
      setNewPlayerSmsOptIn(false);
      setIsAddPlayerDialogOpen(false);
    };

    try {
      await submit();
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        await requireAdmin(submit);
        return;
      }
      console.error('Error adding player:', error);
      alert(`Failed to add player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveEditedPlayer = async () => {
    if (!editingPlayer || !editedPlayerName.trim()) {
      return;
    }

    const payload = {
      name: editedPlayerName.trim(),
      startYear: editedPlayerStartYear ? parseInt(editedPlayerStartYear) : null,
      phoneNumber: editedPlayerPhoneNumber.trim() || null,
      smsOptIn: editedPlayerSmsOptIn,
    };

    const submit = async () => {
      const response = await updatePlayer(editingPlayer.id, payload);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update player');
      }

      await response.json();
      await fetchPlayers();
      closeEditPlayerDialog();
    };

    try {
      await submit();
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        await requireAdmin(submit);
        return;
      }
      console.error('Error updating player:', error);
      alert(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeletePlayer = async (id: number) => {
    const submit = async () => {
      const response = await deletePlayer(id);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete player');
      }

      await fetchPlayers();
    };

    try {
      await submit();
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        await requireAdmin(submit);
        return;
      }
      console.error('Error deleting player:', error);
      alert(`Failed to delete player: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
        {filteredPlayers.map((player) => (
          <div key={player.id} className="w-full sm:w-[200px] flex-grow">
            <PlayerCard
              player={player}
              onEdit={startEditingPlayer}
              onDelete={handleDeletePlayer}
            />
          </div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="w-full text-center py-10 text-gray-500">
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
                <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="player-name"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="start-year" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Year (optional)
                </label>
                <input
                  id="start-year"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={newPlayerStartYear || ''}
                  onChange={(e) => setNewPlayerStartYear(e.target.value ? parseInt(e.target.value) : undefined)}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <label htmlFor="player-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="player-phone"
                  type="text"
                  placeholder="e.g. +15551234567"
                  className="w-full p-2 border rounded"
                  value={newPlayerPhoneNumber}
                  onChange={(e) => setNewPlayerPhoneNumber(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="sms-opt-in"
                  type="checkbox"
                  checked={newPlayerSmsOptIn}
                  onChange={(e) => setNewPlayerSmsOptIn(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sms-opt-in" className="text-sm font-medium text-gray-700">
                  Receive SMS reminders
                </label>
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

      {editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Player</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-player-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="edit-player-name"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editedPlayerName}
                  onChange={(e) => setEditedPlayerName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="edit-start-year" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Year (optional)
                </label>
                <input
                  id="edit-start-year"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editedPlayerStartYear}
                  onChange={(e) => setEditedPlayerStartYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <label htmlFor="edit-player-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="edit-player-phone"
                  type="text"
                  placeholder="e.g. +15551234567"
                  className="w-full p-2 border rounded"
                  value={editedPlayerPhoneNumber}
                  onChange={(e) => setEditedPlayerPhoneNumber(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="edit-sms-opt-in"
                  type="checkbox"
                  checked={editedPlayerSmsOptIn}
                  onChange={(e) => setEditedPlayerSmsOptIn(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-sms-opt-in" className="text-sm font-medium text-gray-700">
                  Receive SMS reminders
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                onClick={closeEditPlayerDialog}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => void handleSaveEditedPlayer()}
              >
                Update Player
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
