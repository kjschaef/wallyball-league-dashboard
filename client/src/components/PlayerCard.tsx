import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { startOfWeek, subWeeks } from "date-fns";
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
  
  // Calculate inactivity penalty
  const today = new Date();
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
  const maxPenalty = 0.5; // 50% maximum penalty
  const penaltyPerWeek = 0.05; // 5% penalty per week after grace period
  
  // Get the last match date or creation date if no matches
  const lastMatch = player.matches && player.matches.length > 0 
    ? new Date(player.matches[player.matches.length - 1].date) 
    : (player.createdAt ? new Date(player.createdAt) : new Date());
  
  // Calculate inactivity time in milliseconds
  const inactiveTime = today.getTime() - lastMatch.getTime();
  
  // Calculate excess inactive time (after 2-week grace period)
  const excessInactiveTime = Math.max(0, inactiveTime - twoWeeksInMs);
  
  // Calculate weeks inactive beyond grace period
  const weeksInactive = Math.floor(excessInactiveTime / (7 * 24 * 60 * 60 * 1000));
  
  // Calculate penalty (5% per week after grace period, up to 50%)
  const inactivityPenalty = Math.min(maxPenalty, weeksInactive * penaltyPerWeek);
  
  const decayFactor = 1 - inactivityPenalty;
  
  // Apply decay factor to win percentage
  const winRateBase = total > 0 ? Math.round((stats.won / total) * 100) : 0;
  const winRate = weeksInactive > 0 
    ? Math.round(winRateBase * decayFactor) 
    : winRateBase;
  
  // Count unique days on which matches were played
  const uniqueDays = new Set(
    matches.map(match => new Date(match.date).toLocaleDateString())
  ).size;
  
  // Calculate wins per day
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
        <CardTitle className="text-lg font-bold flex items-center gap-3">
          {player.name}
          {yearsPlayed !== null && (
            <span className="text-sm font-normal text-muted-foreground">
              Years played: {yearsPlayed}
            </span>
          )}
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
                <AlertDialogAction onClick={() => onDelete && onDelete(player.id)}>
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
                  value={player.startYear ? player.startYear.toString() : ''}
                  onChange={(e) => {}}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="text-left">
                  <span className="text-sm text-muted-foreground block">Record</span>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">
                      <span className="text-green-600">{stats.won}</span>
                      {" - "}
                      <span className="text-red-600">{stats.lost}</span>
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {total} games
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Wins/Day:</span>
                  <span className="text-sm">{winsPerDay}</span>
                  {weeksInactive > 0 && inactivityPenalty > 0 && (
                    <div className="text-xs text-red-500">
                      -{Math.round(inactivityPenalty * 100)}% inactive
                    </div>
                  )}
                </div>
              </div>

              {matches.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Streak:</span>
                  <span className="text-sm">
                    {(() => {
                      const weeks = new Set();
                      let streak = 0;
                      const now = new Date();
                      let currentWeek = startOfWeek(now);
                      
                      for (const match of matches.sort((a, b) => 
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                      )) {
                        const matchWeek = startOfWeek(new Date(match.date));
                        if (currentWeek.getTime() === matchWeek.getTime()) {
                          if (!weeks.has(matchWeek.getTime())) {
                            weeks.add(matchWeek.getTime());
                            streak++;
                          }
                        } else if (
                          matchWeek.getTime() === 
                          startOfWeek(subWeeks(currentWeek, 1)).getTime()
                        ) {
                          if (!weeks.has(matchWeek.getTime())) {
                            weeks.add(matchWeek.getTime());
                            streak++;
                            currentWeek = matchWeek;
                          }
                        } else {
                          break;
                        }
                      }
                      return `${streak} weeks`;
                    })()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Achievements as small icons */}
            <div className="flex flex-wrap gap-1">
              <PlayerAchievements playerId={player.id} compact />
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm text-muted-foreground block mb-1">Win Percentage</span>
            <span className={`text-3xl font-bold ${
              winRate >= 60 ? 'text-green-600' : 
              winRate >= 45 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>{winRate}%</span>
            {weeksInactive > 0 && inactivityPenalty > 0 && (
              <div className="text-xs text-red-500 mt-1">
                Actual: {winRateBase}% (-{Math.round(inactivityPenalty * 100)}% inactive)
              </div>
            )}
            <div className="w-full bg-gray-200 dark:bg-gray-700 mt-2 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  winRate >= 60 ? 'bg-green-600' : 
                  winRate >= 45 ? 'bg-yellow-600' : 
                  'bg-red-600'
                }`} 
                style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}