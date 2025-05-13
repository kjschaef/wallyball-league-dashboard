"use client";

import React, { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { format } from "date-fns";
import { calculatePenalizedWinPercentage } from "../lib/utils";

const COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
  "#db2777", // pink-600
];

interface PerformanceTrendProps {
  isExporting?: boolean;
}

export function PerformanceTrend({ isExporting = false }: PerformanceTrendProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
    queryFn: () => fetch("/api/players").then(res => res.json())
  });

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const processDataForChart = () => {
    if (!players.length) return [];

    const allDates = new Set<string>();
    players.forEach((player: any) => {
      player.matches.forEach((match: any) => {
        const date = new Date(match.date).toISOString().split("T")[0];
        allDates.add(date);
      });
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((dateStr) => {
      const dataPoint: any = {
        date: dateStr,
      };

      players.forEach((player: any) => {
        if (
          selectedPlayers.length === 0 ||
          selectedPlayers.includes(player.id)
        ) {
          const matchesUpToDate = player.matches.filter(
            (match: any) =>
              new Date(match.date).toISOString().split("T")[0] <= dateStr
          );

          if (matchesUpToDate.length > 0) {
            const wins = matchesUpToDate.filter((m: any) => m.won).length;
            const total = matchesUpToDate.length;
            const lastMatchDate = new Date(
              matchesUpToDate[matchesUpToDate.length - 1].date
            );

            const penalizedWinPercentage = calculatePenalizedWinPercentage(
              wins,
              total - wins,
              lastMatchDate
            );

            dataPoint[player.name] = Math.round(penalizedWinPercentage * 100);
          }
        }
      });

      return dataPoint;
    });
  };

  const chartData = processDataForChart();

  const playersToDisplay = players.filter(
    (player: any) =>
      selectedPlayers.length === 0 || selectedPlayers.includes(player.id)
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {players.map((player: any, index: number) => (
            <button
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedPlayers.includes(player.id) || selectedPlayers.length === 0
                  ? `bg-${COLORS[index % COLORS.length]}/10 text-${
                      COLORS[index % COLORS.length]
                    }`
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }`}
              style={{
                backgroundColor:
                  selectedPlayers.includes(player.id) || selectedPlayers.length === 0
                    ? `${COLORS[index % COLORS.length]}20`
                    : "",
                color:
                  selectedPlayers.includes(player.id) || selectedPlayers.length === 0
                    ? COLORS[index % COLORS.length]
                    : "",
              }}
            >
              {player.name}
            </button>
          ))}
        </div>

        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
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
                  tickFormatter={(dateStr) => format(new Date(dateStr), "MMM d")}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value}%`, ""]}
                  labelFormatter={(dateStr) =>
                    format(new Date(dateStr), "MMMM d, yyyy")
                  }
                />
                <Legend />
                {playersToDisplay.map((player: any, index: number) => (
                  <Line
                    key={player.id}
                    type="monotone"
                    dataKey={player.name}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
