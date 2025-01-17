
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DailyWins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [wins, setWins] = useState<{ [key: number]: string }>({});
  const [calculatedLosses, setCalculatedLosses] = useState<{ [key: number]: number }>({});
  const [date, setDate] = useState<Date>(new Date());

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
    const totalWins = Object.values(wins).reduce((sum, w) => sum + (parseInt(w) || 0), 0);
    const activePlayers = Object.values(wins).filter(w => w !== "").length;
    const avgLosses = activePlayers > 0 ? (totalWins / activePlayers) / 2 : 0;

    const newLosses = Object.entries(wins).reduce((acc, [playerId, wonStr]) => {
      if (wonStr === "") return acc;
      acc[playerId] = Math.max(0, Math.round(avgLosses));
      return acc;
    }, {} as { [key: number]: number });

    setCalculatedLosses(newLosses);
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
        lost: calculatedLosses[playerId] || 0
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
              <div key={player.id} className="flex items-center gap-4">
                <span className="w-32 font-medium">{player.name}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Wins"
                    value={wins[player.id] || ""}
                    onChange={(e) =>
                      setWins((prev) => ({
                        ...prev,
                        [player.id]: e.target.value,
                      }))
                    }
                  />
                  <div className="flex items-center text-sm text-muted-foreground">
                    {calculatedLosses[player.id] !== undefined && 
                      `Losses: ${calculatedLosses[player.id]}`
                    }
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
