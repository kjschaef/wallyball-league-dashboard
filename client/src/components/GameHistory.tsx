import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Game } from "@db/schema";

interface GameHistoryProps {
  games: Array<{
    id: number;
    date: string;
    teamOnePlayers: string[];
    teamTwoPlayers: string[];
    teamOneGamesWon: number;
    teamTwoGamesWon: number;
  }>;
}

export function GameHistory({ games }: GameHistoryProps) {
  const [date, setDate] = useState<DateRange | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/games/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Game deleted successfully" });
    },
  });

  // Sort games by date, most recent first
  const sortedGames = [...games].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredGames = sortedGames.filter((game) => {
    if (!date?.from) return true;
    const gameDate = new Date(game.date);
    if (date.to) {
      return gameDate >= date.from && gameDate <= date.to;
    }
    return gameDate >= date.from;
  });

  const formatTeam = (players: string[]) => {
    if (players.length === 0) return "No players";
    if (players.length === 1) return players[0];
    if (players.length === 2) return `${players[0]} and ${players[1]}`;
    return `${players[0]}, ${players[1]} and ${players[2]}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Filter by date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4">
        {filteredGames.map((game) => (
          <div key={game.id} className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {format(new Date(game.date), "MMM d")}
              </span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  game.teamOneGamesWon > game.teamTwoGamesWon ? "text-green-600" : ""
                )}>
                  {formatTeam(game.teamOnePlayers)}
                </span>
                <span className="text-sm text-muted-foreground px-1">vs</span>
                <span className={cn(
                  "font-medium",
                  game.teamTwoGamesWon > game.teamOneGamesWon ? "text-green-600" : ""
                )}>
                  {formatTeam(game.teamTwoPlayers)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {game.teamOneGamesWon} - {game.teamTwoGamesWon}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Match</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this match? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(game.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}