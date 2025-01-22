import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const COLORS = [
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Turquoise
  "#FFD93D", // Sun Yellow
  "#6C5CE7", // Deep Purple
  "#A8E6CF", // Mint Green
  "#FF8B94", // Light Pink
  "#45B7D1", // Sky Blue
  "#98CE00", // Lime Green
  "#FF71CE", // Hot Pink
  "#01CDFE", // Electric Blue
  "#05FFA1", // Neon Green
  "#B967FF", // Bright Purple
];

export function PerformanceTrend() {
  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  if (!players) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px] flex items-center justify-center">
            Loading player data...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process player data to calculate cumulative wins per days played
  const playerStats = players.map((player) => {
    const dailyStats = new Map();
    let cumulativeWins = 0;
    let daysPlayed = new Set();

    // Sort matches by date
    const sortedMatches = [...(player.matches || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedMatches.forEach((match: any) => {
      const date = format(new Date(match.date), "yyyy-MM-dd");
      const gamesWon = match.isTeamOne ? match.teamOneGamesWon || 0 : match.teamTwoGamesWon || 0;
      cumulativeWins += gamesWon;
      daysPlayed.add(date);
      dailyStats.set(date, { gamesWon: cumulativeWins / daysPlayed.size });
    });

    return {
      id: player.id,
      name: player.name,
      dailyStats,
    };
  });

  // Get all unique dates
  const allDates = new Set<string>();
  playerStats.forEach((player) => {
    player.dailyStats.forEach((_, date) => allDates.add(date));
  });

  // Create chart data with wins and losses
  const chartData = playerStats.map(player => ({
    name: player.name,
    wins: player.matches.reduce((sum, match) => sum + (match.isTeamOne ? match.teamOneGamesWon : match.teamTwoGamesWon), 0),
    losses: player.matches.reduce((sum, match) => sum + (match.isTeamOne ? match.teamTwoGamesWon : match.teamOneGamesWon), 0)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Wins vs Losses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="wins" stackId="a" fill="#4ade80" name="Wins" />
              <Bar dataKey="losses" stackId="a" fill="#f87171" name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold mb-2 text-sm">Standings</h3>
          <div className="grid grid-cols-3 gap-1">
            {playerStats
              .map(player => {
                const lastDataPoint = chartData[chartData.length - 1];
                return {
                  name: player.name,
                  winsPerDay: lastDataPoint[player.name] || 0
                };
              })
              .sort((a, b) => b.winsPerDay - a.winsPerDay)
              .map((player, index) => {
                const color = COLORS[playerStats.findIndex(p => p.name === player.name) % COLORS.length];
                return (
                  <div 
                    key={player.name}
                    className="flex items-center justify-between px-2 py-2.5 bg-muted rounded-lg"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <div className="flex items-center gap-1 min-w-0 flex-grow mr-1.5">
                      <span className="text-[0.65rem] sm:text-xs shrink-0 text-muted-foreground">{index + 1}.</span>
                      <span className="text-[0.7rem] sm:text-sm w-full font-bold" style={{ color }}>{player.name}</span>
                    </div>
                    <span className="text-xs sm:text-base font-semibold shrink-0 pl-1" style={{ color }}>
                      {player.winsPerDay.toFixed(1)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}