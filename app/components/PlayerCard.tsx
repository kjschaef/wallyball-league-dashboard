'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { getExperienceLevel } from '../lib/elo';

interface Player {
  id: number;
  name: string;
  startYear?: number | null;
  createdAt?: string | Date | null;
}

interface PlayerCardProps {
  player: Player & {
    matches: Array<{ won: boolean, date: string }>,
    stats: { won: number, lost: number, totalMatchTime?: number, elo?: number, isProvisional?: boolean }
  };
  onEdit?: (player: Player) => void;
  onDelete?: (id: number) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedName, setEditedName] = useState(player.name);
  const [editedStartYear, setEditedStartYear] = useState(player.startYear?.toString() || '');

  const { stats } = player;
  const total = stats.won + stats.lost;

  // Calculate win percentage
  const winRate = total > 0 ? (stats.won / total) * 100 : 0;

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

  const handleDeleteConfirm = () => {
    onDelete?.(player.id);
    setShowDeleteDialog(false);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold">{player.name}</h3>
            {(() => {
              const exp = getExperienceLevel(total);
              return (
                <span
                  title={exp.description}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${exp.badgeClass} cursor-help`}
                >
                  {exp.name}
                </span>
              );
            })()}
            {yearsPlayed !== null && (
              <span className="text-xs text-gray-500">
                {yearsPlayed}y
              </span>
            )}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit ? onEdit(player) : setShowEditDialog(true)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Edit player"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-500 hover:text-red-700 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
                    className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Player</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {player.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="space-y-2">
          {/* Dual Metrics: Win Rate & Power Ranking */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50/80 rounded-lg border border-gray-100">
            <div className="text-center">
              <span className={`text-lg font-bold ${winRate > 53 ? 'text-green-600' :
                winRate >= 45 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>{winRate.toFixed(1)}%</span>
              <span className="text-[10px] text-gray-500 block">Win Rate</span>
              <div className="w-full bg-gray-200 mt-1 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${winRate > 53 ? 'bg-green-600' :
                    winRate >= 45 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                  style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                />
              </div>
            </div>

            <div className="text-center" title={stats.isProvisional ? "< 25 career games" : "Power Ranking"}>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold text-indigo-700">
                  {stats.elo ?? 1500}
                </span>
                {stats.isProvisional && (
                  <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-semibold">
                    PROV
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 block">Power Ranking</span>
              <div className="w-full bg-indigo-100 mt-1 rounded-full h-1">
                <div
                  className="h-1 rounded-full bg-indigo-600"
                  style={{ width: `${Math.min(100, Math.max(5, (((stats.elo ?? 1500) - 1000) / 1000) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Record */}
          <div className="flex justify-between items-center px-1 text-xs text-gray-600">
            <span>Record: <strong className="text-green-600">{stats.won}</strong> - <strong className="text-red-600">{stats.lost}</strong></span>
            <span className="text-gray-500">{total} games</span>
          </div>
        </div>
      </div>
    </div>
  );
}