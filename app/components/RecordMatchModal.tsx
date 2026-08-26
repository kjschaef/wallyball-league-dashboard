"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Calendar as CalendarIcon, Loader2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { isPlayerActive } from "../lib/playerFiltering";

interface Player {
  id: number;
  name: string;
  lastGameDate?: string | null;
  matches?: Array<{ won: boolean; date: string }>;
}

export interface GameScoreInput {
  gameNumber: number;
  teamOneScore: number;
  teamTwoScore: number;
}

export interface MatchPayload {
  teamOnePlayers: number[];
  teamTwoPlayers: number[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
  date: string;
  gameScores?: GameScoreInput[];
}

interface RecordMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (match: MatchPayload) => Promise<boolean>;
  suggestedTeams?: {
    teamOne: number[];
    teamTwo: number[];
  };
  prefilledWins?: {
    teamOneWins: number;
    teamTwoWins: number;
  };
  initialGameScores?: GameScoreInput[];
}

interface PlayerGridProps {
  players: Player[];
  selectedPlayers: number[];
  onPlayerToggle: (playerId: number) => void;
  maxPlayers: number;
  title: string;
  disabledPlayers?: number[];
}

function PlayerGrid({ players, selectedPlayers, onPlayerToggle, maxPlayers, title, disabledPlayers = [] }: PlayerGridProps) {
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);

  const handlePlayerClick = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      onPlayerToggle(playerId);
    } else if (selectedPlayers.length < maxPlayers && !disabledPlayers.includes(playerId)) {
      onPlayerToggle(playerId);
    }
  };

  const activePlayers = players.filter((player) => {
    if (player.lastGameDate !== undefined) {
      return isPlayerActive(player.lastGameDate);
    }
    if (player.matches && player.matches.length > 0) {
      const latest = new Date(Math.max(...player.matches.map((m) => new Date(m.date).getTime()))).toISOString();
      return isPlayerActive(latest);
    }
    if (player.matches && player.matches.length === 0) {
      return false;
    }
    return true;
  });

  const inactivePlayers = players.filter((player) => {
    if (player.lastGameDate !== undefined) {
      return !isPlayerActive(player.lastGameDate);
    }
    if (player.matches && player.matches.length > 0) {
      const latest = new Date(Math.max(...player.matches.map((m) => new Date(m.date).getTime()))).toISOString();
      return !isPlayerActive(latest);
    }
    if (player.matches && player.matches.length === 0) {
      return true;
    }
    return false;
  });

  const renderPlayerButton = (player: Player) => {
    const isSelected = selectedPlayers.includes(player.id);
    const isDisabled = disabledPlayers.includes(player.id);
    const canSelect = (selectedPlayers.length < maxPlayers || isSelected) && !isDisabled;
    
    return (
      <button
        key={player.id}
        type="button"
        aria-pressed={isSelected}
        onClick={() => handlePlayerClick(player.id)}
        disabled={!canSelect}
        className={`
          px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
          ${isSelected 
            ? 'bg-blue-500 text-white' 
            : isDisabled
              ? 'bg-red-100 text-red-400 cursor-not-allowed'
              : canSelect 
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {player.name}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Players (up to {maxPlayers})</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {activePlayers.map(renderPlayerButton)}
      </div>

      {inactivePlayers.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsInactiveOpen(!isInactiveOpen)}
            aria-expanded={isInactiveOpen}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 py-1 transition-colors"
          >
            {isInactiveOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span>Inactive Players ({inactivePlayers.length})</span>
          </button>
          {isInactiveOpen && (
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100">
              {inactivePlayers.map(renderPlayerButton)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RecordMatchModal({ isOpen, onClose, onSubmit, suggestedTeams, prefilledWins, initialGameScores }: RecordMatchModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamOnePlayers, setTeamOnePlayers] = useState<number[]>([]);
  const [teamTwoPlayers, setTeamTwoPlayers] = useState<number[]>([]);
  const [teamOneGamesWon, setTeamOneGamesWon] = useState(0);
  const [teamTwoGamesWon, setTeamTwoGamesWon] = useState(0);
  const [enableGameScores, setEnableGameScores] = useState(true);
  const [gameScores, setGameScores] = useState<GameScoreInput[]>([
    { gameNumber: 1, teamOneScore: 11, teamTwoScore: 0 },
    { gameNumber: 2, teamOneScore: 0, teamTwoScore: 11 },
    { gameNumber: 3, teamOneScore: 11, teamTwoScore: 0 }
  ]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
      // Set suggested teams if provided
      if (suggestedTeams) {
        setTeamOnePlayers(suggestedTeams.teamOne);
        setTeamTwoPlayers(suggestedTeams.teamTwo);
      }
      // Set prefilled wins if provided
      if (prefilledWins) {
        setTeamOneGamesWon(prefilledWins.teamOneWins);
        setTeamTwoGamesWon(prefilledWins.teamTwoWins);
      }
      if (initialGameScores && initialGameScores.length > 0) {
        setEnableGameScores(true);
        setGameScores(initialGameScores);
      }
    }
  }, [isOpen, suggestedTeams, prefilledWins, initialGameScores]);

  // Synchronize derived games won when gameScores are enabled
  useEffect(() => {
    if (enableGameScores) {
      const team1Wins = gameScores.filter(g => g.teamOneScore > g.teamTwoScore).length;
      const team2Wins = gameScores.filter(g => g.teamTwoScore > g.teamOneScore).length;
      setTeamOneGamesWon(team1Wins);
      setTeamTwoGamesWon(team2Wins);
    }
  }, [enableGameScores, gameScores]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/players");
      if (response.ok) {
        const data = await response.json();
        const sortedPlayers = data.sort((a: { matches?: unknown[] }, b: { matches?: unknown[] }) => {
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

  const handleScoreChange = (index: number, field: 'teamOneScore' | 'teamTwoScore', value: number) => {
    setErrorMessage(null);
    const updated = [...gameScores];
    updated[index] = {
      ...updated[index],
      [field]: Math.max(0, value)
    };
    setGameScores(updated);
  };

  const handleAddGame = () => {
    const nextGameNumber = gameScores.length + 1;
    setGameScores([
      ...gameScores,
      { gameNumber: nextGameNumber, teamOneScore: 11, teamTwoScore: 0 }
    ]);
  };

  const handleRemoveGame = (index: number) => {
    if (gameScores.length <= 1) return;
    const updated = gameScores.filter((_, i) => i !== index).map((g, i) => ({
      ...g,
      gameNumber: i + 1
    }));
    setGameScores(updated);
  };

  const resetForm = () => {
    setTeamOnePlayers([]);
    setTeamTwoPlayers([]);
    setTeamOneGamesWon(0);
    setTeamTwoGamesWon(0);
    setEnableGameScores(true);
    setGameScores([
      { gameNumber: 1, teamOneScore: 11, teamTwoScore: 0 },
      { gameNumber: 2, teamOneScore: 0, teamTwoScore: 11 },
      { gameNumber: 3, teamOneScore: 11, teamTwoScore: 0 }
    ]);
    setDate(new Date().toISOString().split('T')[0]);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isSubmitting) return;

    if (teamOnePlayers.length === 0 || teamTwoPlayers.length === 0) {
      setErrorMessage("Please select at least one player for each team");
      return;
    }

    // Check for overlapping players
    const overlap = teamOnePlayers.some(playerId => teamTwoPlayers.includes(playerId));
    if (overlap) {
      setErrorMessage("A player cannot be on both teams");
      return;
    }

    if (enableGameScores) {
      if (gameScores.length === 0) {
        setErrorMessage("Please add at least one game score");
        return;
      }
      for (const gs of gameScores) {
        if (gs.teamOneScore === gs.teamTwoScore) {
          setErrorMessage(`Game ${gs.gameNumber} is tied (${gs.teamOneScore}-${gs.teamTwoScore}). In wallyball, a game cannot end in a tie.`);
          return;
        }
      }
    } else {
      if (teamOneGamesWon === 0 && teamTwoGamesWon === 0) {
        setErrorMessage("Please enter games won for at least one team");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: MatchPayload = {
        teamOnePlayers,
        teamTwoPlayers,
        teamOneGamesWon: enableGameScores
          ? gameScores.filter(g => g.teamOneScore > g.teamTwoScore).length
          : teamOneGamesWon,
        teamTwoGamesWon: enableGameScores
          ? gameScores.filter(g => g.teamTwoScore > g.teamOneScore).length
          : teamTwoGamesWon,
        date,
        gameScores: enableGameScores ? gameScores : undefined
      };

      const shouldClose = await onSubmit(payload);

      if (shouldClose) {
        resetForm();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Record Match</h2>
              <p className="text-gray-600 mt-1">Enter match details, player rosters, and optional game scores.</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded-md"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

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

          {/* Team One */}
          <div className="space-y-4">
            <PlayerGrid
              players={players}
              selectedPlayers={teamOnePlayers}
              onPlayerToggle={handleTeamOnePlayerToggle}
              maxPlayers={3}
              title="Team One"
              disabledPlayers={teamTwoPlayers}
            />
          </div>

          {/* Team Two */}
          <div className="space-y-4">
            <PlayerGrid
              players={players}
              selectedPlayers={teamTwoPlayers}
              onPlayerToggle={handleTeamTwoPlayerToggle}
              maxPlayers={3}
              title="Team Two"
              disabledPlayers={teamOnePlayers}
            />
          </div>

          {/* Detailed Scores Toggle */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">Log Individual Game Scores</span>
                <p className="text-sm text-gray-500">Record point-by-point scores for each game played (e.g. 11-9)</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enableGameScores}
                onClick={() => setEnableGameScores(!enableGameScores)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  enableGameScores ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enableGameScores ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Score Input Mode */}
          {enableGameScores ? (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Game Scores</h4>
                <div className="text-sm font-medium text-gray-700">
                  Calculated Match Result: <span className="font-bold text-blue-600">{teamOneGamesWon} - {teamTwoGamesWon}</span>
                </div>
              </div>

              <div className="space-y-3">
                {gameScores.map((game, idx) => {
                  const t1Wins = game.teamOneScore > game.teamTwoScore;
                  const t2Wins = game.teamTwoScore > game.teamOneScore;
                  return (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="font-semibold text-sm text-gray-700 sm:w-20">
                        Game {game.gameNumber}
                      </div>

                      {/* Team 1 Score controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 sm:hidden">T1:</span>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(idx, 'teamOneScore', game.teamOneScore - 1)}
                          className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                          aria-label={`Decrease Team 1 score for Game ${game.gameNumber}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={game.teamOneScore}
                          onChange={(e) => handleScoreChange(idx, 'teamOneScore', parseInt(e.target.value) || 0)}
                          className={`w-14 text-center py-1 border rounded font-semibold ${t1Wins ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'}`}
                          aria-label={`Team 1 score for Game ${game.gameNumber}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleScoreChange(idx, 'teamOneScore', game.teamOneScore + 1)}
                          className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                          aria-label={`Increase Team 1 score for Game ${game.gameNumber}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(idx, 'teamOneScore', 11)}
                          className={`px-2 py-1 text-xs font-semibold rounded border ${game.teamOneScore === 11 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                          title="Set to 11"
                        >
                          11
                        </button>
                      </div>

                      <span className="text-gray-400 font-bold text-center">vs</span>

                      {/* Team 2 Score controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 sm:hidden">T2:</span>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(idx, 'teamTwoScore', game.teamTwoScore - 1)}
                          className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                          aria-label={`Decrease Team 2 score for Game ${game.gameNumber}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={game.teamTwoScore}
                          onChange={(e) => handleScoreChange(idx, 'teamTwoScore', parseInt(e.target.value) || 0)}
                          className={`w-14 text-center py-1 border rounded font-semibold ${t2Wins ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'}`}
                          aria-label={`Team 2 score for Game ${game.gameNumber}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleScoreChange(idx, 'teamTwoScore', game.teamTwoScore + 1)}
                          className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                          aria-label={`Increase Team 2 score for Game ${game.gameNumber}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(idx, 'teamTwoScore', 11)}
                          className={`px-2 py-1 text-xs font-semibold rounded border ${game.teamTwoScore === 11 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                          title="Set to 11"
                        >
                          11
                        </button>
                      </div>

                      {/* Remove Game */}
                      {gameScores.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGame(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors self-end sm:self-center"
                          aria-label={`Remove Game ${game.gameNumber}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddGame}
                className="w-full py-2 bg-white border border-dashed border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="team-one-score" className="block text-sm font-medium text-gray-700">Team One Games Won</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTeamOneGamesWon(Math.max(0, teamOneGamesWon - 1))}
                    disabled={teamOneGamesWon === 0}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
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
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                    aria-label="Increase team one games won"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="team-two-score" className="block text-sm font-medium text-gray-700">Team Two Games Won</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTeamTwoGamesWon(Math.max(0, teamTwoGamesWon - 1))}
                    disabled={teamTwoGamesWon === 0}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
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
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                    aria-label="Increase team two games won"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 text-white py-4 rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                Recording...
              </>
            ) : (
              'Record Match'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
