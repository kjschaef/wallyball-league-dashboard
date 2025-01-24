import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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
  const [metric, setMetric] = useState<'winsPerDay' | 'totalWins'>('winsPerDay');
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
  // Get most recent date with matches
  const mostRecentDate = players
    .flatMap(player => player.matches || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;

  // Get players from most recent date
  const recentPlayerIds = new Set(
    players
      .flatMap(player => (player.matches || []).map(match => ({
        ...match,
        playerId: player.id
      })))
      .filter(match => new Date(match.date).toDateString() === new Date(mostRecentDate).toDateString())
      .flatMap(match => [
        match.isTeamOne ? match.playerId : null,
        !match.isTeamOne ? match.playerId : null,
      ])
      .filter((id): id is number => id !== null)
  );

  const playerStats = players.map((player) => {
    const dailyStats = new Map();
    let cumulativeWins = 0;
    let daysPlayed = new Set();
    const isRecent = recentPlayerIds.has(player.id);

    // Sort matches by date
    const sortedMatches = [...(player.matches || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedMatches.forEach((match: any) => {
      const date = format(new Date(match.date), "yyyy-MM-dd");
      const gamesWon = match.isTeamOne ? match.teamOneGamesWon || 0 : match.teamTwoGamesWon || 0;
      cumulativeWins += gamesWon;
      daysPlayed.add(date);
      dailyStats.set(date, { 
        winsPerDay: cumulativeWins / daysPlayed.size,
        totalWins: cumulativeWins 
      });
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

  // Create chart data with cumulative wins
  const chartData = Array.from(allDates)
    .sort()
    .reduce((acc, date) => {
      const dataPoint: any = { date };
      playerStats.forEach((player) => {
        const stats = player.dailyStats.get(date);
        if (stats) {
          dataPoint[player.name] = stats[metric];
        } else if (acc.length > 0) {
          // Use the last known value
          dataPoint[player.name] = acc[acc.length - 1][player.name] ?? 0;
        } else {
          dataPoint[player.name] = 0;
        }
      });
      acc.push(dataPoint);
      return acc;
    }, [] as any[]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{metric === 'winsPerDay' ? 'Wins Per Day Played' : 'Total Wins'}</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant={metric === 'winsPerDay' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setMetric('winsPerDay')}
          >
            Per Day
          </Button>
          <Button 
            variant={metric === 'totalWins' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setMetric('totalWins')}
          >
            Total
          </Button>
        </div>
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
                domain={[0, "auto"]}
                tickFormatter={(value) => Math.round(value)}
              />
              <Tooltip
                labelFormatter={(date) => format(parseISO(date as string), "MMM d, yyyy")}
                formatter={(value: number, name: string) => [Number(value.toFixed(1)), name]}
              />
              <Legend />
              {playerStats.map((player, index) => (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={recentPlayerIds.has(player.id) ? 3 : 1.5}
                  strokeOpacity={recentPlayerIds.has(player.id) ? 1 : 0.6}
                  dot={{ r: recentPlayerIds.has(player.id) ? 5 : 3 }}
                  activeDot={{ r: recentPlayerIds.has(player.id) ? 7 : 5 }}
                  name={player.name}
                />
              ))}
            </LineChart>
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
                  value: lastDataPoint[player.name] || 0
                };
              })
              .sort((a, b) => b.value - a.value)
              .map((player, index) => {
                const color = COLORS[playerStats.findIndex(p => p.name === player.name) % COLORS.length];
                return (
                  <div 
                    key={player.name}
                    className={cn(
                      "flex items-center justify-between px-2 py-2.5 bg-muted rounded-lg relative",
                      recentPlayerIds.has(player.id) && "bg-primary/10 ring-2 ring-primary shadow-md border border-primary/20"
                    )}
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    {recentPlayerIds.has(player.id) && (
                      <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-primary rounded-full" />
                    )}
                    <div className="flex items-center gap-1 min-w-0 flex-grow mr-1.5">
                      <span className="text-[0.65rem] sm:text-xs shrink-0 text-muted-foreground">{index + 1}.</span>
                      <span className="text-[0.7rem] sm:text-sm w-full font-bold" style={{ color }}>{player.name}</span>
                    </div>
                    <span className="text-xs sm:text-base font-semibold shrink-0 pl-1" style={{ color }}>
                      {player.value.toFixed(1)}
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