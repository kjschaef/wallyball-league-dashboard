import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Player } from "@db/schema";
import { PlayerCard } from "@/components/PlayerCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startOfToday, endOfToday, startOfYear, endOfYear } from "date-fns";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface MatchResult {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export default function Results() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    player: Player | null;
  }>({
    isOpen: false,
    player: null,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const { data: matches = [] } = useQuery<MatchResult[]>({
    queryKey: ["/api/matches"],
  });

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const queryClient = useQueryClient();
  const toast = useToast();

  const updateMutation = useMutation({
    mutationFn: (player: Player) =>
      fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      closeDialog();
      toast({ title: "Player updated successfully" });
    },
  });

  const closeDialog = () => {
    setDialogState({ isOpen: false, player: null });
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const playerData = {
      name: formData.get("name") as string,
    };

    if (dialogState.player) {
      updateMutation.mutate({ ...dialogState.player, ...playerData });
    }
  };

  const today = new Date();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const todayMatches = matches.filter(match => {
    const matchDate = new Date(match.date);
    return matchDate >= todayStart && matchDate <= todayEnd;
  });

  const seasonStart = startOfYear(today);
  const seasonEnd = endOfYear(today);

  const seasonMatches = matches.filter(match => {
    const matchDate = new Date(match.date);
    return matchDate >= seasonStart && matchDate <= seasonEnd;
  });

  const seasonStats = seasonMatches.reduce((acc, match) => {
    return {
      totalMatches: acc.totalMatches + 1,
      totalGames: acc.totalGames + match.teamOneGamesWon + match.teamTwoGamesWon,
      averageGamesPerMatch: (acc.totalGames + match.teamOneGamesWon + match.teamTwoGamesWon) / (acc.totalMatches + 1)
    };
  }, { totalMatches: 0, totalGames: 0, averageGamesPerMatch: 0 });

  const formatTeam = (players: string[]) => {
    if (players.length === 0) return "No players";
    if (players.length === 1) return players[0];
    if (players.length === 2) return `${players[0]} and ${players[1]}`;
    return `${players[0]}, ${players[1]} and ${players[2]}`;
  };

  const shareAsImage = async () => {
    const element = document.getElementById('results-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `volleyball-results-${format(today, 'yyyy-MM-dd')}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error creating image:', error);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/players/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player deleted successfully" });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Results & Standings</h1>

      <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={dialogState.player?.name}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="w-full" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="w-full">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Player Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players?.sort((a, b) => {
          const aWinsPerDay = a.stats.won / (new Set(a.matches.map((m: any) => new Date(m.date).toLocaleDateString())).size || 1);
          const bWinsPerDay = b.stats.won / (new Set(b.matches.map((m: any) => new Date(m.date).toLocaleDateString())).size || 1);
          return bWinsPerDay - aWinsPerDay;
        }).map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={(player) => setDialogState({ isOpen: true, player })}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>

      <div id="results-content" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Matches - {format(today, "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {todayMatches.length === 0 ? (
              <p className="text-muted-foreground">No matches played today</p>
            ) : (
              <div className="space-y-4">
                {todayMatches.map((match) => (
                  <div key={match.id} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{formatTeam(match.teamOnePlayers)}</div>
                      <div className="font-medium">{formatTeam(match.teamTwoPlayers)}</div>
                    </div>
                    <div className="text-lg font-bold tabular-nums">
                      {match.teamOneGamesWon} - {match.teamTwoGamesWon}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Season Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold">{seasonStats.totalMatches}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{seasonStats.totalGames}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Games per Match</p>
                <p className="text-2xl font-bold">{seasonStats.averageGamesPerMatch.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}