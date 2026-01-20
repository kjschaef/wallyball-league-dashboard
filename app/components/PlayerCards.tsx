"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Edit, Trash2, TrendingUp, Calendar } from "lucide-react";

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
    type: "wins" | "losses";
    count: number;
  };
  actualWinPercentage?: number;
}

const getWinPercentageGradient = (percentage: number): string => {
  if (percentage > 53) return "from-emerald-500 to-emerald-600";
  if (percentage >= 40) return "from-amber-500 to-amber-600";
  return "from-rose-500 to-rose-600";
};

interface PlayerCardProps {
  player: PlayerStats;
  onEdit: (player: PlayerStats) => void;
  onDelete: (playerId: number) => void;
}

function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-gray-800 leading-tight">
              {player.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                <span>{player.yearsPlayed}y</span>
              </div>
              <div className="flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>{player.record.totalGames}G</span>
              </div>
            </div>
          </div>

          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              className="p-1 hover:bg-white/80 rounded transition-colors shadow-sm"
              onClick={() => onEdit(player)}
              title="Edit player"
            >
              <Edit className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-1 hover:bg-red-50 rounded transition-colors shadow-sm"
                  title="Delete player"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-600 hover:text-red-600" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Player</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {player.name}? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(player.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-3">
          {/* Win Percentage - Main Feature */}
          <div className="text-center">
            <div className="relative inline-block">
              <div
                className={`text-2xl font-bold bg-gradient-to-r ${getWinPercentageGradient(player.winPercentage)} bg-clip-text text-transparent leading-none`}
              >
                {player.winPercentage.toFixed(1)}%
              </div>
              <p className="text-[10px] text-gray-500">Win Rate</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getWinPercentageGradient(player.winPercentage)} transition-all duration-500 ease-out`}
                style={{
                  width: `${Math.min(100, Math.max(0, player.winPercentage))}%`,
                }}
              />
            </div>
          </div>



          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/60 rounded-lg p-2 border border-gray-100">
              <p className="text-[10px] font-medium text-gray-600 mb-0.5">Record</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm font-bold text-emerald-600">
                  {player.record.wins}
                </span>
                <span className="text-gray-400 text-xs">-</span>
                <span className="text-sm font-bold text-rose-600">
                  {player.record.losses}
                </span>
              </div>
            </div>

            <div className="bg-white/60 rounded-lg p-2 border border-gray-100">
              <p className="text-[10px] font-medium text-gray-600 mb-0.5">
                Time
              </p>
              <div className="text-center">
                <span className="text-sm font-bold text-blue-600">
                  {player.totalPlayingTime}
                </span>
                <span className="text-[10px] text-gray-500 ml-0.5">h</span>
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-white/60 rounded-lg p-2 border border-gray-100 flex justify-between items-center">
            <p className="text-[10px] font-medium text-gray-600">
              Streak
            </p>
            <span className="text-sm font-bold text-gray-900">
              {player.streak.count}w
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PlayerCards() {
  const [editingPlayer, setEditingPlayer] = useState<PlayerStats | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: playerStats,
    isLoading,
    error,
  } = useQuery<PlayerStats[]>({
    queryKey: ["/api/player-stats"],
    queryFn: () => fetch("/api/player-stats").then((res) => res.json()),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (updatedPlayer: {
      id: number;
      name: string;
      startYear?: number | null;
    }) => {
      const response = await fetch("/api/players", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPlayer),
      });

      if (!response.ok) {
        throw new Error("Failed to update player");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player-stats"] });
      setIsEditDialogOpen(false);
      setEditingPlayer(null);
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await fetch(`/api/players?id=${playerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete player");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player-stats"] });
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
    const name = formData.get("name") as string;
    const startYear = formData.get("startYear") as string;

    updatePlayerMutation.mutate({
      id: editingPlayer.id,
      name: name.trim(),
      startYear: startYear ? parseInt(startYear) : null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Player Statistics</h2>
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-full sm:w-[200px] flex-grow">
              <Card
                className="p-6 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100"
              >
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Player Statistics</h2>
        <div className="p-6 border border-red-200 rounded-xl bg-gradient-to-r from-red-50 to-rose-50">
          <p className="text-red-800 font-medium">
            Failed to load player statistics. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!playerStats || playerStats.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Player Statistics</h2>
        <div className="p-12 text-center border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
          <p className="text-gray-600 text-lg">
            No players found. Add some players to see their statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Player Statistics</h2>
      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
        {playerStats.map((player) => (
          <div key={player.id} className="w-full sm:w-[200px] flex-grow">
            <PlayerCard
              player={player}
              onEdit={handleEditPlayer}
              onDelete={handleDeletePlayer}
            />
          </div>
        ))}
      </div>

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Edit Player
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingPlayer?.name || ""}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="startYear"
                  className="text-sm font-medium text-gray-700"
                >
                  Start Year
                </Label>
                <Input
                  id="startYear"
                  name="startYear"
                  type="number"
                  min="1900"
                  max="2100"
                  defaultValue={
                    editingPlayer
                      ? (
                        new Date().getFullYear() - editingPlayer.yearsPlayed
                      ).toString()
                      : ""
                  }
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-200 hover:bg-gray-50"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updatePlayerMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={updatePlayerMutation.isPending}
              >
                {updatePlayerMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
