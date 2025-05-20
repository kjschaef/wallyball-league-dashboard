'use client';

import { useState } from 'react';
import { PlayerAchievements } from './PlayerAchievements';
import { calculatePenalizedWinPercentage } from '../lib/utils';

interface Player {
  id: number;
  name: string;
  startYear?: number | null;
  createdAt?: string | Date | null;
}

interface PlayerCardProps {
  player: Player & { 
    matches: Array<{ won: boolean, date: string }>, 
    stats: { won: number, lost: number } 
  };
  onEdit?: (player: Player) => void;
  onDelete?: (id: number) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editStartYear, setEditStartYear] = useState<number | undefined>(
    player.startYear || undefined
  );

  // Calculate win percentage
  const totalGames = player.stats.won + player.stats.lost;
  const rawWinPercentage = totalGames > 0 
    ? (player.stats.won / totalGames) * 100 
    : 0;
  
  // Get penalized win percentage, accounting for inactivity
  const penalizedWinPercentage = calculatePenalizedWinPercentage(player);
  
  // Generate a streak description
  const getStreakText = () => {
    if (!player.matches || player.matches.length === 0) return 'No matches played';
    
    const recentMatches = [...player.matches].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5);
    
    let streak = 1;
    const isWinningStreak = recentMatches[0].won;
    
    for (let i = 1; i < recentMatches.length; i++) {
      if (recentMatches[i].won === isWinningStreak) {
        streak++;
      } else {
        break;
      }
    }
    
    if (streak === 1) return 'No current streak';
    return isWinningStreak ? `${streak} win streak` : `${streak} loss streak`;
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit({
        ...player,
        name: editName,
        startYear: editStartYear || null
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(player.name);
    setEditStartYear(player.startYear || undefined);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Card Header */}
      <div className="bg-gray-800 text-white p-4">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              className="w-full p-2 border rounded text-gray-800"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="flex items-center">
              <label className="text-sm mr-2">Start Year:</label>
              <input
                type="number"
                className="w-full p-2 border rounded text-gray-800"
                value={editStartYear || ''}
                onChange={(e) => setEditStartYear(e.target.value ? parseInt(e.target.value) : undefined)}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">{player.name}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-300 hover:text-white"
                aria-label="Edit player"
              >
                ✏️
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(player.id)}
                  className="p-1 text-gray-300 hover:text-white"
                  aria-label="Delete player"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm text-gray-500">Win Rate</h4>
            <p className="text-xl font-bold">{rawWinPercentage.toFixed(1)}%</p>
            {penalizedWinPercentage !== rawWinPercentage && (
              <p className="text-xs text-gray-500">
                Adjusted: {penalizedWinPercentage.toFixed(1)}%
              </p>
            )}
          </div>
          <div>
            <h4 className="text-sm text-gray-500">Record</h4>
            <p className="text-xl font-bold">
              {player.stats.won} - {player.stats.lost}
            </p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500">Matches</h4>
            <p className="text-xl font-bold">{totalGames}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500">Streak</h4>
            <p className="text-lg font-medium">{getStreakText()}</p>
          </div>
        </div>

        {/* Achievements Section */}
        <div>
          <h4 className="text-sm text-gray-500 mb-2">Achievements</h4>
          <PlayerAchievements playerId={player.id} compact={true} />
        </div>
      </div>
    </div>
  );
}