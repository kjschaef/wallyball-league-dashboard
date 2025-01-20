import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startOfToday, endOfToday, startOfYear, endOfYear } from "date-fns";

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

  // Filter today's matches
  const today = new Date();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  
  const todayMatches = matches.filter(match => {
    const matchDate = new Date(match.date);
    return matchDate >= todayStart && matchDate <= todayEnd;
  });

  // Calculate season statistics
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

  const exportResults = () => {
    const results = {
      date: format(today, "MMMM d, yyyy"),
      todayMatches: todayMatches.map(match => ({
        teamOne: formatTeam(match.teamOnePlayers),
        teamTwo: formatTeam(match.teamTwoPlayers),
        score: `${match.teamOneGamesWon}-${match.teamTwoGamesWon}`,
      })),
      seasonStats,
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volleyball-results-${format(today, "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const text = `Volleyball Results - ${format(today, "MMMM d, yyyy")}\n\n` +
      "Today's Matches:\n" +
      todayMatches.map(match => 
        `${formatTeam(match.teamOnePlayers)} vs ${formatTeam(match.teamTwoPlayers)}: ${match.teamOneGamesWon}-${match.teamTwoGamesWon}`
      ).join("\n") +
      "\n\nSeason Statistics:\n" +
      `Total Matches: ${seasonStats.totalMatches}\n` +
      `Total Games: ${seasonStats.totalGames}\n` +
      `Average Games per Match: ${seasonStats.averageGamesPerMatch.toFixed(1)}`;

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Volleyball Results</h1>
        <div className="space-x-2">
          <Button onClick={copyToClipboard} variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={exportResults} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

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
  );
}
