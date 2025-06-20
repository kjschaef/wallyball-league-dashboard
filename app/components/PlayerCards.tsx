'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Edit, Trash2 } from 'lucide-react';

interface PlayerStats {
  id: number;
  name: string;
  yearsPlayed: number;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  winPercentage: number;
  totalPlayingTime: number;
  streak: {
    type: 'wins' | 'losses';
    count: number;
  };
  actualWinPercentage?: number;
  inactivityPenalty?: number;
}



function getWinPercentageColor(percentage: number): string {
  if (percentage > 53) return 'text-green-600';
  if (percentage >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

interface PlayerCardProps {
  player: PlayerStats;
  onEdit: (player: PlayerStats) => void;
  onDelete: (playerId: number) => void;
}

function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const showInactivityPenalty = player.inactivityPenalty && player.inactivityPenalty > 0;
  
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Decorative top border */}
      <div className={`h-1 w-full ${getWinPercentageColor(player.winPercentage).includes('green') ? 'bg-gradient-to-r from-green-400 to-green-600' : getWinPercentageColor(player.winPercentage).includes('yellow') ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}></div>
      
      <div className="p-4">
        {/* Header with name and actions */}
        <CardHeader className="p-0 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                {player.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {player.yearsPlayed} {player.yearsPlayed === 1 ? 'year' : 'years'}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {player.record.totalGames} games
                </span>
              </div>
            </div>
            <div className="flex gap-1 ml-3">
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                onClick={() => onEdit(player)}
                title="Edit player"
              >
                <Edit className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-2 hover:bg-red-50 rounded-full transition-colors duration-200" title="Delete player">
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Player</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {player.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(player.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          {/* Main stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Record Section */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Record</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-green-600">{player.record.wins}</span>
                <span className="text-gray-400 font-medium">-</span>
                <span className="text-lg font-bold text-red-600">{player.record.losses}</span>
              </div>
            </div>
            
            {/* Win Percentage Section */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Win Rate</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${getWinPercentageColor(player.winPercentage)}`}>
                  {player.winPercentage}
                </span>
                <span className={`text-sm font-medium ${getWinPercentageColor(player.winPercentage)}`}>%</span>
              </div>
              {showInactivityPenalty && (
                <div className="mt-1">
                  <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Base: {player.actualWinPercentage}% (-{player.inactivityPenalty}% penalty)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Streak Section */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Longest Streak</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{player.streak.count}</span>
              <span className="text-sm text-gray-600">
                {player.streak.count === 1 ? 'week' : 'weeks'}
              </span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                player.streak.type === 'wins' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {player.streak.type === 'wins' ? '📈 Win' : '📉 Loss'}
              </div>
            </div>
          </div>

          {/* Win Percentage Visual Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Performance</span>
              <span>{player.winPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  player.winPercentage >= 60 ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                  player.winPercentage >= 45 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, player.winPercentage))}%` }}
              />
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function PlayerCards() {
  const [editingPlayer, setEditingPlayer] = useState<PlayerStats | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: playerStats, isLoading, error } = useQuery<PlayerStats[]>({
    queryKey: ['/api/player-stats'],
    queryFn: () => fetch('/api/player-stats').then((res) => res.json()),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (updatedPlayer: { id: number; name: string; startYear?: number | null }) => {
      const response = await fetch('/api/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPlayer),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player-stats'] });
      setIsEditDialogOpen(false);
      setEditingPlayer(null);
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await fetch(`/api/players?id=${playerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player-stats'] });
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleEditPlayer = (player: PlayerStats) => {
    setEditingPlayer(player);
    setIsEditDialogOpen(true);
  };

  const handleDeletePlayer = (playerId: number) => {
    deletePlayerMutation.mutate(playerId);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPlayer) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const startYear = formData.get('startYear') as string;

    updatePlayerMutation.mutate({
      id: editingPlayer.id,
      name: name.trim(),
      startYear: startYear ? parseInt(startYear) : null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Failed to load player statistics. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!playerStats || playerStats.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
        <div className="p-8 text-center border border-gray-200 rounded-lg">
          <p className="text-gray-500">No players found. Add some players to see their statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playerStats.map((player) => (
          <PlayerCard key={player.id} player={player} onEdit={handleEditPlayer} onDelete={handleDeletePlayer} />
        ))}
      </div>

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingPlayer?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startYear">Start Year</Label>
                <Input
                  id="startYear"
                  name="startYear"
                  type="number"
                  min="1900"
                  max="2100"
                  defaultValue={editingPlayer ? (new Date().getFullYear() - editingPlayer.yearsPlayed).toString() : ''}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updatePlayerMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full"
                disabled={updatePlayerMutation.isPending}
              >
                {updatePlayerMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}