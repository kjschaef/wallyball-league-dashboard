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
    <div className="cfa-card p-6 relative animate-fade-in">
      {/* Header with name and actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{player.name}</h3>
          <p className="text-sm text-gray-600">Playing for {player.yearsPlayed} years</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            onClick={() => onEdit(player)}
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200">
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="cfa-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold text-gray-900">Delete Player</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Are you sure you want to delete {player.name}? This action cannot be undone and will remove all their match history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="cfa-button-secondary">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(player.id)} className="cfa-button-primary bg-red-600 hover:bg-red-700">
                  Delete Player
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-600 mb-1">Match Record</p>
          <p className="text-lg font-bold text-gray-900">
            <span className="text-green-600">{player.record.wins}</span> - <span className="text-red-600">{player.record.losses}</span>
          </p>
          <p className="text-xs text-gray-500">{player.record.totalGames} total games</p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-600 mb-1">Win Rate</p>
          <p className={`text-2xl font-bold ${getWinPercentageColor(player.winPercentage)}`}>
            {player.winPercentage}%
          </p>
          {showInactivityPenalty && (
            <p className="text-xs text-red-500 mt-1">
              Raw: {player.actualWinPercentage}% (−{player.inactivityPenalty}%)
            </p>
          )}
        </div>
      </div>

      {/* Current Streak Badge */}
      <div className="flex justify-center">
        <div className={`cfa-badge ${player.streak.type === 'wins' ? 'cfa-badge-success' : 'cfa-badge-warning'}`}>
          {player.streak.count} {player.streak.type} streak
        </div>
      </div>
    </div>
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