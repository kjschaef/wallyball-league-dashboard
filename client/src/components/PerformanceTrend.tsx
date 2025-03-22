import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfWeek } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateInactivityPenalty } from "@/lib/utils";

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

interface PerformanceTrendProps {
  isExporting?: boolean;
}

interface PlayerMatch {
  date: string;
  isTeamOne: boolean;
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export function PerformanceTrend({ isExporting = false }: PerformanceTrendProps) {
  const [showAllData, setShowAllData] = useState(false);
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

  // Defining the match type to fix the type error
  interface Match {
    date: string;
    isTeamOne: boolean;
    teamOneGamesWon?: number;
    teamTwoGamesWon?: number;
    [key: string]: any;
  }

  // Calculate win percentage and wins per day for each player
  const playerStats = players
    .filter(player => player.matches && player.matches.length > 0)
    .map(player => {
      const matches = [...player.matches]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let totalGames = 0;
      let gamesWon = 0;

      matches.forEach(match => {
        const isTeamOne = match.isTeamOne;
        gamesWon += isTeamOne ? match.teamOneGamesWon : match.teamTwoGamesWon;
        totalGames += match.teamOneGamesWon + match.teamTwoGamesWon;
      });

      // Calculate win percentage
      const winPercentage = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

      // Calculate wins per day
      const dateSet = new Set(matches.map(match => startOfWeek(new Date(match.date)).toISOString()));
      const winsPerDay = gamesWon / dateSet.size;

      return {
        name: player.name,
        winPercentage,
        winsPerDay,
        date: matches[matches.length - 1].date,
      };
    });

  const metrics = [
    { id: 'winPercentage', name: 'Win %', domain: [0, 100] },
    { id: 'winsPerDay', name: 'Wins/Day', domain: [0, 'auto'] }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Trend</CardTitle>
          <ToggleGroup type="single" value={showAllData ? "all" : "weekly"}>
            <ToggleGroupItem value="weekly" onClick={() => setShowAllData(false)}>
              Weekly
            </ToggleGroupItem>
            <ToggleGroupItem value="all" onClick={() => setShowAllData(true)}>
              All Data
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={playerStats}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => showAllData 
                  ? format(parseISO(date), "MMM d")
                  : `Week of ${format(parseISO(date), "MMM d")}`
                }
              />
              <YAxis
                domain={[0, 100]}
                yAxisId="winPercentage"
                orientation="left"
                label={{ value: 'Win %', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                domain={[0, 'auto']}
                yAxisId="winsPerDay"
                orientation="right"
                label={{ value: 'Wins/Day', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}${name === 'Win %' ? '%' : ''}`,
                  name
                ]}
                labelFormatter={(date) => format(parseISO(date as string), "MMM d, yyyy")}
              />
              {playerStats.map((entry, index) => (
                <Line
                  key={`${entry.name}-winPercentage`}
                  type="monotone"
                  dataKey="winPercentage"
                  name={`${entry.name} Win %`}
                  stroke={COLORS[index % COLORS.length]}
                  yAxisId="winPercentage"
                  dot={false}
                />
              ))}
              {playerStats.map((entry, index) => (
                <Line
                  key={`${entry.name}-winsPerDay`}
                  type="monotone"
                  dataKey="winsPerDay"
                  name={`${entry.name} Wins/Day`}
                  stroke={COLORS[(index + playerStats.length) % COLORS.length]}
                  yAxisId="winsPerDay"
                  dot={false}
                  strokeDasharray="5 5"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}