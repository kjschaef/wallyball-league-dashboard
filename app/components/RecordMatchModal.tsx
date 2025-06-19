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

interface PlayerGridProps {
  players: Player[];
  selectedPlayers: number[];
  onPlayerToggle: (playerId: number) => void;
  maxPlayers: number;
  title: string;
}

function PlayerGrid({ players, selectedPlayers, onPlayerToggle, maxPlayers, title }: PlayerGridProps) {
  const handlePlayerClick = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      onPlayerToggle(playerId);
    } else if (selectedPlayers.length < maxPlayers) {
      onPlayerToggle(playerId);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Players (up to {maxPlayers})</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {players.map((player) => {
          const isSelected = selectedPlayers.includes(player.id);
          const canSelect = selectedPlayers.length < maxPlayers || isSelected;
          
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => handlePlayerClick(player.id)}
              disabled={!canSelect}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isSelected 
                  ? 'bg-blue-500 text-white' 
                  : canSelect 
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {player.name}
            </button>
          );
        })}
      </div>
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
        // Sort players by total number of games played (matches), most active first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedPlayers = data.sort((a: any, b: any) => {
          const aGamesPlayed = a.matches ? a.matches.length : 0;
          const bGamesPlayed = b.matches ? b.matches.length : 0;
          return bGamesPlayed - aGamesPlayed;
        });
        setPlayers(sortedPlayers);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  const handleTeamOnePlayerToggle = (playerId: number) => {
    if (teamOnePlayers.includes(playerId)) {
      setTeamOnePlayers(teamOnePlayers.filter(id => id !== playerId));
    } else if (teamOnePlayers.length < 3) {
      setTeamOnePlayers([...teamOnePlayers, playerId]);
    }
  };

  const handleTeamTwoPlayerToggle = (playerId: number) => {
    if (teamTwoPlayers.includes(playerId)) {
      setTeamTwoPlayers(teamTwoPlayers.filter(id => id !== playerId));
    } else if (teamTwoPlayers.length < 3) {
      setTeamTwoPlayers([...teamTwoPlayers, playerId]);
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Record Game</h2>
              <p className="text-gray-600 mt-1">Enter the game details including teams, scores, and date.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Date */}
          <div className="space-y-2">
            <label htmlFor="match-date" className="block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="match-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PlayerGrid
              players={players}
              selectedPlayers={teamOnePlayers}
              onPlayerToggle={handleTeamOnePlayerToggle}
              maxPlayers={3}
              title="Team One"
            />
            
            <PlayerGrid
              players={players}
              selectedPlayers={teamTwoPlayers}
              onPlayerToggle={handleTeamTwoPlayerToggle}
              maxPlayers={3}
              title="Team Two"
            />
          </div>

          {/* Games Won */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="team-one-score" className="block text-sm font-medium text-gray-700">Games Won</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setTeamOneGamesWon(Math.max(0, teamOneGamesWon - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Decrease team one games won"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-center w-16 h-12 bg-gray-50 rounded-lg">
                  <span id="team-one-score" className="text-xl font-semibold">{teamOneGamesWon}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTeamOneGamesWon(teamOneGamesWon + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Increase team one games won"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="team-two-score" className="block text-sm font-medium text-gray-700">Games Won</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setTeamTwoGamesWon(Math.max(0, teamTwoGamesWon - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Decrease team two games won"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-center w-16 h-12 bg-gray-50 rounded-lg">
                  <span id="team-two-score" className="text-xl font-semibold">{teamTwoGamesWon}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTeamTwoGamesWon(teamTwoGamesWon + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Increase team two games won"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-4 rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors"
          >
            Record Game
          </button>
        </form>
      </div>
    </div>
  );
}