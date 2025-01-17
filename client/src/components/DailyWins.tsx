import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function DailyWins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [wins, setWins] = useState<{ [key: number]: string }>({});

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
          date: new Date(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setWins({});
      toast({ title: "Games recorded successfully" });
    },
  });

  const calculatedStats = useMemo(() => {
    if (!players || !wins) return null;

    const totalWins = Object.values(wins).reduce((sum, w) => sum + (parseInt(w) || 0), 0);
    const activePlayers = Object.values(wins).filter(w => w !== "").length;
    const avgLosses = activePlayers > 0 ? (totalWins / activePlayers) / 2 : 0;

    return Object.entries(wins).reduce((acc, [playerId, wonStr]) => {
      if (wonStr === "") return acc;
      const won = parseInt(wonStr);
      acc[playerId] = {
        won,
        lost: Math.max(0, Math.round(avgLosses))
      };
      return acc;
    }, {} as { [key: number]: { won: number; lost: number } });
  }, [wins, players]);

  const handleSubmit = async () => {
    if (!calculatedStats) return;
    
    for (const [playerId, stats] of Object.entries(calculatedStats)) {
      await mutation.mutateAsync({
        playerId: parseInt(playerId),
        won: stats.won,
        lost: stats.lost
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
                    {calculatedStats?.[player.id] && 
                      `Losses: ${calculatedStats[player.id].lost}`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
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