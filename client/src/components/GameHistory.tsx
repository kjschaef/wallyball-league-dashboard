import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Game History</h2>
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
          <Card key={game.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {format(new Date(game.date), "PPP")}
              </CardTitle>
              <CardDescription>
                Game #{game.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-lg font-semibold mb-2">
                      {formatTeam(game.teamOnePlayers)}
                    </p>
                    <p className={cn(
                      "text-2xl font-bold",
                      game.teamOneGamesWon > game.teamTwoGamesWon ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {game.teamOneGamesWon}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-2">
                      {formatTeam(game.teamTwoPlayers)}
                    </p>
                    <p className={cn(
                      "text-2xl font-bold",
                      game.teamTwoGamesWon > game.teamOneGamesWon ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {game.teamTwoGamesWon}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}