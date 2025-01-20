import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
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

interface PlayerStats {
  won: number;
  lost: number;
}

interface Match {
  date: string;
  won: boolean;
}

interface PlayerWithStats extends Player {
  matches: Match[];
  stats: PlayerStats;
}

interface PlayerCardProps {
  player: PlayerWithStats;
  onEdit: (player: Player) => void;
  onDelete: (id: number) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const { stats, matches } = player;
  const total = stats.won + stats.lost;
  const winRate = total > 0 ? Math.round((stats.won / total) * 100) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Count unique days on which matches were played
  const uniqueDays = new Set(
    matches.map(match => new Date(match.date).toLocaleDateString())
  ).size;

  // Calculate average wins per day (total wins / number of unique days)
  const winsPerDay = uniqueDays > 0 
    ? (stats.won / uniqueDays).toFixed(1)
    : "0.0";

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

  // Trigger achievement check whenever stats are shown
  React.useEffect(() => {
    checkAchievementsMutation.mutate(player.id);
  }, [player.id, stats.won, stats.lost, checkAchievementsMutation]);

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
            onClick={() => onEdit(player)}
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
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="col-span-2 text-center bg-blue-50 rounded-lg p-3">
              <p className="text-blue-600 font-medium">Wins/Day</p>
              <p className="text-3xl font-bold text-blue-600">{winsPerDay}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Record</p>
              <p className="text-xl font-medium">
                <span className="text-green-600">{stats.won}</span>
                {" / "}
                <span className="text-red-600">{stats.lost}</span>
              </p>
              <p className="text-xs text-muted-foreground">Total: {total}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{winRate}%</p>
            </div>
          </div>

          {/* Add achievements section */}
          <PlayerAchievements playerId={player.id} />
        </div>
      </CardContent>
    </Card>
  );
}