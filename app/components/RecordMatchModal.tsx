
"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Calendar as CalendarIcon, ChevronDown } from "lucide-react";

interface Player {
  id: number;
  name: string;
}

interface Match {
  teamOnePlayers: number[];
  teamTwoPlayers: number[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
  date: string;
}

interface RecordMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (match: Match) => void;
}

interface MultiSelectProps {
  players: Player[];
  selectedPlayers: number[];
  onSelectionChange: (playerIds: number[]) => void;
  maxPlayers: number;
  placeholder: string;
}

function MultiSelect({ players, selectedPlayers, onSelectionChange, maxPlayers, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePlayerToggle = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      onSelectionChange(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < maxPlayers) {
      onSelectionChange([...selectedPlayers, playerId]);
    }
  };

  const getSelectedPlayerNames = () => {
    return selectedPlayers
      .map(id => players.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <span className={selectedPlayers.length === 0 ? "text-gray-500" : "text-gray-900"}>
          {selectedPlayers.length === 0 ? placeholder : getSelectedPlayerNames()}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {players.map(player => {
            const isSelected = selectedPlayers.includes(player.id);
            const isDisabled = !isSelected && selectedPlayers.length >= maxPlayers;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => !isDisabled && handlePlayerToggle(player.id)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  disabled={isDisabled}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={isSelected ? 'font-medium text-blue-600' : 'text-gray-900'}>
                  {player.name}
                </span>
              </button>
            );
          })}
          {players.length === 0 && (
            <div className="px-3 py-2 text-gray-500 text-sm">No players available</div>
          )}
        </div>
      )}

      {selectedPlayers.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          Selected {selectedPlayers.length}/{maxPlayers} players
        </div>
      )}
    </div>
  );
}

export function RecordMatchModal({ isOpen, onClose, onSubmit }: RecordMatchModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamOnePlayers, setTeamOnePlayers] = useState<number[]>([]);
  const [teamTwoPlayers, setTeamTwoPlayers] = useState<number[]>([]);
  const [teamOneGamesWon, setTeamOneGamesWon] = useState(0);
  const [teamTwoGamesWon, setTeamTwoGamesWon] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/players");
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (teamOnePlayers.length === 0 || teamTwoPlayers.length === 0) {
      alert("Please select at least one player for each team");
      return;
    }

    // Check for overlapping players
    const overlap = teamOnePlayers.some(playerId => teamTwoPlayers.includes(playerId));
    if (overlap) {
      alert("A player cannot be on both teams");
      return;
    }

    onSubmit({
      teamOnePlayers,
      teamTwoPlayers,
      teamOneGamesWon,
      teamTwoGamesWon,
      date
    });

    // Reset form
    setTeamOnePlayers([]);
    setTeamTwoPlayers([]);
    setTeamOneGamesWon(0);
    setTeamTwoGamesWon(0);
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Record New Match</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Match Date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team One */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-lg text-gray-900">Team One</h3>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Players
                </label>
                <MultiSelect
                  players={players}
                  selectedPlayers={teamOnePlayers}
                  onSelectionChange={setTeamOnePlayers}
                  maxPlayers={3}
                  placeholder="Select up to 3 players"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Games Won
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTeamOneGamesWon(Math.max(0, teamOneGamesWon - 1))}
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={teamOneGamesWon}
                    onChange={(e) => setTeamOneGamesWon(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center text-lg py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={() => setTeamOneGamesWon(teamOneGamesWon + 1)}
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Team Two */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="font-semibold text-lg text-gray-900">Team Two</h3>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Players
                </label>
                <MultiSelect
                  players={players}
                  selectedPlayers={teamTwoPlayers}
                  onSelectionChange={setTeamTwoPlayers}
                  maxPlayers={3}
                  placeholder="Select up to 3 players"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Games Won
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTeamTwoGamesWon(Math.max(0, teamTwoGamesWon - 1))}
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={teamTwoGamesWon}
                    onChange={(e) => setTeamTwoGamesWon(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center text-lg py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={() => setTeamTwoGamesWon(teamTwoGamesWon + 1)}
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Record Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
