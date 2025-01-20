
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "@/components/PlayerCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startOfToday, endOfToday, startOfYear, endOfYear } from "date-fns";
import html2canvas from "html2canvas";

interface MatchResult {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export default function Results() {
  const { data: matches = [] } = useQuery<MatchResult[]>({
    queryKey: ["/api/matches"],
  });

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Results & Standings</h1>
        <Button onClick={shareAsImage} variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share as Image
        </Button>
      </div>

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
            onEdit={(player) => {
              // Implement edit functionality if needed
            }}
            onDelete={(id) => {
              // Implement delete functionality if needed
            }}
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
