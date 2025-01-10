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
import type { Player } from "@db/schema";

interface PlayerCardProps {
  player: Player & { 
    games: Array<{ won: boolean, date: string }>, 
    stats: { won: number, lost: number } 
  };
  onEdit: (player: Player) => void;
  onDelete: (id: number) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const { stats, games } = player;
  const total = stats.won + stats.lost;
  const winRate = total > 0 ? ((stats.won / total) * 100).toFixed(1) : "0.0";

  // Calculate wins per day
  const winsPerDay = games.reduce((acc, game) => {
    const date = new Date(game.date).toLocaleDateString();
    if (game.won) {
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate average wins per day
  const uniqueDays = Object.keys(winsPerDay).length;
  const averageWinsPerDay = uniqueDays > 0 
    ? (Object.values(winsPerDay).reduce((a, b) => a + b, 0) / uniqueDays).toFixed(1)
    : "0.0";

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
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{winRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Wins</p>
            <p className="text-2xl font-bold text-green-600">{stats.won}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Losses</p>
            <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Wins/Day</p>
            <p className="text-2xl font-bold text-blue-600">{averageWinsPerDay}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}