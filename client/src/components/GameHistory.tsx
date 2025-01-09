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

interface Game {
  id: number;
  date: string;
  teamOnePlayerOneId: number | null;
  teamOnePlayerTwoId: number | null;
  teamOnePlayerThreeId: number | null;
  teamTwoPlayerOneId: number | null;
  teamTwoPlayerTwoId: number | null;
  teamTwoPlayerThreeId: number | null;
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

interface Player {
  id: number;
  name: string;
}

interface GameHistoryProps {
  games: Game[];
  players: Player[];
}

export function GameHistory({ games, players }: GameHistoryProps) {
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

  const getPlayerName = (id: number | null) => {
    if (!id) return null;
    const player = players.find(p => p.id === id);
    return player ? player.name : "Unknown Player";
  };

  const formatTeam = (playerIds: (number | null)[]) => {
    const teamPlayers = playerIds
      .map(id => players.find(p => p.id === id))
      .filter(player => player !== undefined)
      .map(player => player?.name);

    if (teamPlayers.length === 0) return "No players";
    if (teamPlayers.length === 1) return teamPlayers[0];
    if (teamPlayers.length === 2) return `${teamPlayers[0]} and ${teamPlayers[1]}`;
    return `${teamPlayers[0]}, ${teamPlayers[1]} and ${teamPlayers[2]}`;
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-1">Team One</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTeam([
                      game.teamOnePlayerOneId,
                      game.teamOnePlayerTwoId,
                      game.teamOnePlayerThreeId,
                    ])}
                  </p>
                  <p className="text-lg font-bold mt-2 text-green-600">
                    {game.teamOneGamesWon} games won
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Team Two</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTeam([
                      game.teamTwoPlayerOneId,
                      game.teamTwoPlayerTwoId,
                      game.teamTwoPlayerThreeId,
                    ])}
                  </p>
                  <p className="text-lg font-bold mt-2 text-blue-600">
                    {game.teamTwoGamesWon} games won
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}