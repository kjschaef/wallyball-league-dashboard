import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
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
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
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

  // Process player data to calculate daily win rates
  const playerStats = players.map((player) => {
    const dailyStats = new Map();

    player.matches?.forEach((match: any) => {
      const isTeamOne =
        match.teamOnePlayerOneId === player.id ||
        match.teamOnePlayerTwoId === player.id ||
        match.teamOnePlayerThreeId === player.id;
      const date = format(new Date(match.date), "yyyy-MM-dd");
      const current = dailyStats.get(date) || { wins: 0, total: 0 };
      const playerTeamGamesWon = isTeamOne ? match.teamOneGamesWon : match.teamTwoGamesWon;
      const opponentTeamGamesWon = isTeamOne ? match.teamTwoGamesWon : match.teamOneGamesWon;
      current.wins += playerTeamGamesWon || 0;
      current.total += (playerTeamGamesWon || 0) + (opponentTeamGamesWon || 0);
      dailyStats.set(date, current);
    });

    return {
      id: player.id,
      name: player.name,
      dailyStats,
    };
  });

  // Combine all dates from all players
  const allDates = new Set<string>();
  playerStats.forEach((player) => {
    player.dailyStats.forEach((_, date) => allDates.add(date));
  });

  // Create chart data
  const chartData = Array.from(allDates)
    .sort()
    .map((date) => {
      const dataPoint: any = { date };

      playerStats.forEach((player) => {
        const stats = player.dailyStats.get(date);
        dataPoint[player.name] = stats ? stats.wins : 0;
      });

      return dataPoint;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Wins Per Day</CardTitle>
        <CardDescription>
          Daily wins for each player
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(parseISO(date), "MMM d")}
              />
              <YAxis 
                domain={[0, 'auto']}
                tickFormatter={(value) => Math.round(value)}
              />
              <Tooltip
                labelFormatter={(date) => format(parseISO(date as string), "MMM d, yyyy")}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend />
              {playerStats.map((player, index) => (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={player.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}