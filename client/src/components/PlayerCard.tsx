import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import { PlayerAchievements } from "./PlayerAchievements";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import type { Player } from "@db/schema";

interface PlayerCardProps {
  player: Player & { 
    matches: Array<{ won: boolean, date: string }>, 
    stats: { won: number, lost: number } 
  };
  onEdit?: (player: Player) => void;
  onDelete?: (id: number) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (updatedPlayer: Player) =>
      fetch(`/api/players/${updatedPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlayer),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowEditDialog(false);
      toast({ title: "Player updated successfully" });
    },
  });

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const playerData = {
      ...player,
      name: formData.get("name") as string,
      startYear: formData.get("startYear") ? parseInt(formData.get("startYear") as string) : null,
    };
    updateMutation.mutate(playerData);
  };
  const { stats, matches } = player;
  const total = stats.won + stats.lost;
  const winRate = total > 0 ? Math.round((stats.won / total) * 100) : 0;

  // Count unique days on which matches were played
  const uniqueDays = new Set(
    matches.map(match => new Date(match.date).toLocaleDateString())
  ).size;

  // Calculate average wins per day with decay factor
  const weeksSinceLastPlay = player.matches?.length 
    ? Math.floor((new Date().getTime() - new Date(player.matches[0].date).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : 0;
    
  const decayFactor = Math.max(0.5, 1 - (weeksSinceLastPlay * 0.05)); // 5% decay per week, minimum 50% effectiveness
  const winsPerDay = uniqueDays > 0 
    ? ((stats.won / uniqueDays) * decayFactor).toFixed(1)
    : "0.0";

  const yearsPlayed = player.startYear 
    ? new Date().getFullYear() - player.startYear 
    : null;

  // Add achievement check mutation
  const checkAchievementsMutation = useMutation({
    mutationFn: (playerId: number) =>
      fetch(`/api/achievements/check/${playerId}`, { method: "POST" })
        .then((res) => res.json()),
    onSuccess: (data) => {
      if (data.newAchievements?.length > 0) {
        toast({
          title: "New Achievement Unlocked!",
          description: `You've earned ${data.newAchievements.length} new achievement${
            data.newAchievements.length > 1 ? "s" : ""
          }!`,
        });
        queryClient.invalidateQueries({ queryKey: [`/api/achievements/${player.id}`] });
      }
    },
  });

  // Only check achievements when player's stats change
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAchievementsMutation.mutate(player.id);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [player.id, stats.won, stats.lost]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">
          {player.name}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit ? onEdit(player) : setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
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
                <AlertDialogAction onClick={() => onDelete(player.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
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
                  defaultValue={player.name}
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
                  defaultValue={player.startYear}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Wins/Day:</span>
              <span className="text-lg font-semibold text-blue-600">{winsPerDay}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Record:</span>
                <span className="text-sm">
                  <span className="text-green-600 font-medium">{stats.won}</span>
                  {" / "}
                  <span className="text-red-600 font-medium">{stats.lost}</span>
                </span>
              </div>
              {yearsPlayed !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Years:</span>
                  <span className="text-sm font-medium">{yearsPlayed}</span>
                </div>
              )}
            </div>
          </div>

          {/* Achievements as small icons */}
          <div className="flex flex-wrap gap-1 mt-2">
            <PlayerAchievements playerId={player.id} compact />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}