'use client';

import { useState } from 'react';
import { calculateInactivityPenaltyWithDecay, filterFutureMatches } from '../../lib/inactivity-penalty';
import { PlayerAchievements } from './PlayerAchievements';

interface Player {
  id: number;
  name: string;
  startYear?: number | null;
  createdAt?: string | Date | null;
}

interface PlayerCardProps {
  player: Player & {
    matches: Array<{ won: boolean, date: string }>,
    stats: { won: number, lost: number, totalMatchTime?: number }
  };
  onEdit?: (player: Player) => void;
  onDelete?: (id: number) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedName, setEditedName] = useState(player.name);
  const [editedStartYear, setEditedStartYear] = useState(player.startYear?.toString() || '');

  const { stats, matches } = player;
  const total = stats.won + stats.lost;

  // Filter out future-dated matches and ensure proper formatting
  const validMatches = filterFutureMatches(matches.map(match => ({ date: match.date })));

  // Calculate inactivity penalty using the centralized logic
  const {
    weeksInactive,
    penaltyPercentage,
    decayFactor
  } = calculateInactivityPenaltyWithDecay(validMatches, player.createdAt?.toString() || null);

  const hasInactivityPenalty = penaltyPercentage > 0;

  // Apply decay factor to win percentage
  const winRateBase = total > 0 ? (stats.won / total) * 100 : 0;
  const winRate = hasInactivityPenalty
    ? winRateBase * decayFactor
    : winRateBase;

  // Count unique days on which matches were played
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _uniqueDays = new Set(
    matches.map(match => new Date(match.date).toLocaleDateString())
  ).size;



  const yearsPlayed = player.startYear
    ? new Date().getFullYear() - player.startYear
    : null;

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedPlayer = {
      ...player,
      name: editedName,
      startYear: editedStartYear ? parseInt(editedStartYear) : null,
    };
    if (onEdit) onEdit(updatedPlayer);
    setShowEditDialog(false);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">{player.name}</h3>
            {yearsPlayed !== null && (
              <span className="text-xs text-gray-500">
                {yearsPlayed}y
              </span>
            )}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit ? onEdit(player) : setShowEditDialog(true)}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Edit player"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${player.name}?`)) {
                  onDelete?.(player.id);
                }
              }}
              className="text-red-500 hover:text-red-700 p-1"
              aria-label="Delete player"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {showEditDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Player</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="startYear" className="block text-sm font-medium text-gray-700">Start Year</label>
                  <input
                    id="startYear"
                    type="number"
                    min="1900"
                    max="2100"
                    value={editedStartYear}
                    onChange={(e) => setEditedStartYear(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditDialog(false)}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="space-y-0.5">
                <div className="text-left">
                  <span className="text-xs text-gray-500 block">Record</span>
                  <div className="flex items-start gap-1.5">
                    <span className="font-medium text-sm">
                      <span className="text-green-600">{stats.won}</span>
                      {" - "}
                      <span className="text-red-600">{stats.lost}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {total} G
                    </span>
                  </div>
                </div>
                {stats.totalMatchTime !== undefined && (
                  <div className="text-left">
                    <span className="text-xs text-gray-500 block">Time</span>
                    <div
                      className="flex items-start gap-1.5"
                      title="Based on 90-minute daily sessions"
                    >
                      <span className="font-medium text-sm">
                        {stats.totalMatchTime}h
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements as small icons */}
            <div className="flex flex-wrap gap-0.5">
              <PlayerAchievements playerId={player.id} compact />
            </div>
          </div>

          <div className="text-right flex flex-col justify-end">
            <span className="text-xs text-gray-500 block mb-0.5">Win %</span>
            <span className={`text-xl font-bold ${winRate > 53 ? 'text-green-600' :
                winRate >= 45 ? 'text-yellow-600' :
                  'text-red-600'
              }`}>{winRate.toFixed(1)}%</span>
            {weeksInactive > 0 && hasInactivityPenalty && (
              <div className="text-[10px] text-red-500 leading-tight">
                Act: {winRateBase.toFixed(1)}%
              </div>
            )}
            <div className="w-full bg-gray-200 mt-1.5 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${winRate > 53 ? 'bg-green-600' :
                    winRate >= 45 ? 'bg-yellow-600' :
                      'bg-red-600'
                  }`}
                style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}