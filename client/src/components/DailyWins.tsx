
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Minus } from "lucide-react";
import { cn } from "../lib/utils"; // Corrected relative path

export function DailyWins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [wins, setWins] = useState<{ [key: number]: string }>({});
  const [calculatedLosses, setCalculatedLosses] = useState<{ [key: number]: number }>({});
  const [date, setDate] = useState<Date>(new Date());
  const [activePlayers, setActivePlayers] = useState<{ [key: number]: boolean }>({});

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const mutation = useMutation({
    mutationFn: async (data: { playerId: number; won: number; lost: number }) =>
      fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamOnePlayerOneId: data.playerId,
          teamOneGamesWon: data.won,
          teamTwoGamesWon: data.lost,
          date: date,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setWins({});
      setCalculatedLosses({});
      toast({ title: "Games recorded successfully" });
    },
  });

  const calculateLosses = () => {
    // Calculate total wins across all players
    const totalWins = Object.values(wins).reduce(
      (sum, w) => sum + (parseInt(w) || 0),
      0
    );

    // Count number of active players (players with wins entered)
    const activePlayers = Object.values(wins).filter(w => w !== "").length;

    // Calculate total games (total wins divided by number of players divided by 2)
    const totalGames = activePlayers > 0 ? Math.round(totalWins / activePlayers / 2) : 0;

    // For each player, calculate their losses as total games minus their wins
    const newLosses = Object.entries(wins).reduce((acc, [playerId, wonStr]) => {
      if (wonStr === "") return acc;
      const playerWins = parseInt(wonStr) || 0;
      acc[Number(playerId)] = Math.max(0, totalGames - playerWins); // Convert playerId to number
      return acc;
    }, {} as { [key: number]: number });

    setCalculatedLosses(newLosses);
  };

  const handleWinsChange = (playerId: number, delta: number) => {
    setWins(prev => {
      const currentWins = parseInt(prev[playerId] || "0") || 0;
      const newWins = Math.max(0, currentWins + delta);
      return {
        ...prev,
        [playerId]: newWins.toString()
      };
    });
  };

  const handleSubmit = async () => {
    if (!Object.keys(calculatedLosses).length) {
      toast({ title: "Please calculate losses first", variant: "destructive" });
      return;
    }

    for (const [playerId, won] of Object.entries(wins)) {
      if (won === "") continue;
      await mutation.mutateAsync({
        playerId: parseInt(playerId),
        won: parseInt(won),
        lost: calculatedLosses[Number(playerId)] || 0, // Convert playerId to number
      });
    }
  };

  if (!players) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Daily Wins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-4">
            {players.map((player) => (
              <div key={player.id} className={cn("flex items-center gap-4", !activePlayers[player.id] && "opacity-50")}>
                <input 
                  type="checkbox"
                  checked={activePlayers[player.id] || false}
                  onChange={(e) => setActivePlayers(prev => ({...prev, [player.id]: e.target.checked}))}
                  className="mr-2"
                />
                <span className="w-32 font-medium">{player.name}</span>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleWinsChange(player.id, -1)}
                    size="icon"
                    disabled={!activePlayers[player.id]}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="text"
                    className="text-center"
                    value={wins[player.id] || "0"}
                    readOnly
                  />
                  <Button 
                    variant="outline"
                    onClick={() => handleWinsChange(player.id, 1)}
                    size="icon"
                    disabled={!activePlayers[player.id]}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {calculatedLosses[player.id] !== undefined &&
                      `Losses: ${calculatedLosses[player.id]}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            className="w-full mb-2"
            onClick={calculateLosses}
            variant="secondary"
          >
            Calculate Losses
          </Button>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={Object.keys(wins).length === 0}
          >
            Record Games
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
