
"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Calendar as CalendarIcon } from "lucide-react";

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

  const handlePlayerToggle = (playerId: number, team: 'one' | 'two') => {
    if (team === 'one') {
      if (teamOnePlayers.includes(playerId)) {
        setTeamOnePlayers(teamOnePlayers.filter(id => id !== playerId));
      } else if (teamOnePlayers.length < 3) {
        setTeamOnePlayers([...teamOnePlayers, playerId]);
      }
    } else {
      if (teamTwoPlayers.includes(playerId)) {
        setTeamTwoPlayers(teamTwoPlayers.filter(id => id !== playerId));
      } else if (teamTwoPlayers.length < 3) {
        setTeamTwoPlayers([...teamTwoPlayers, playerId]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (teamOnePlayers.length === 0 || teamTwoPlayers.length === 0) {
      alert("Please select at least one player for each team");
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

  const getPlayerName = (playerId: number) => {
    return players.find(p => p.id === playerId)?.name || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Record New Match</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team One */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Team One</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Players (up to 3)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {players.map(player => (
                    <label key={player.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={teamOnePlayers.includes(player.id)}
                        onChange={() => handlePlayerToggle(player.id, 'one')}
                        disabled={!teamOnePlayers.includes(player.id) && teamOnePlayers.length >= 3}
                        className="mr-2"
                      />
                      {player.name}
                    </label>
                  ))}
                </div>
                {teamOnePlayers.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {teamOnePlayers.map(getPlayerName).join(", ")}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Games Won
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTeamOneGamesWon(Math.max(0, teamOneGamesWon - 1))}
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
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
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Team Two */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Team Two</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Players (up to 3)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {players.map(player => (
                    <label key={player.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={teamTwoPlayers.includes(player.id)}
                        onChange={() => handlePlayerToggle(player.id, 'two')}
                        disabled={!teamTwoPlayers.includes(player.id) && teamTwoPlayers.length >= 3}
                        className="mr-2"
                      />
                      {player.name}
                    </label>
                  ))}
                </div>
                {teamTwoPlayers.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {teamTwoPlayers.map(getPlayerName).join(", ")}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Games Won
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTeamTwoGamesWon(Math.max(0, teamTwoGamesWon - 1))}
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
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
                    className="h-10 w-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Record Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
