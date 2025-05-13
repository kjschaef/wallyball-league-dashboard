"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Trophy, Percent, Award } from "lucide-react";
import { calculatePenalizedWinPercentage } from "../lib/utils";

export default function Results() {
  const [sortBy, setSortBy] = useState<"winRate" | "gamesPlayed" | "name">("winRate");

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
    queryFn: () => fetch("/api/players").then(res => res.json())
  });

  const processedPlayers = players.map((player: any) => {
    const { stats, matches } = player;
    const totalGames = stats.won + stats.lost;
    const winRate = totalGames > 0 ? stats.won / totalGames : 0;
    
    const lastMatchDate = matches.length > 0
      ? new Date(matches.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0].date)
      : new Date();
    
    const penalizedWinRate = calculatePenalizedWinPercentage(
      stats.won,
      stats.lost,
      lastMatchDate
    );
    
    return {
      ...player,
      winRate,
      penalizedWinRate,
      totalGames,
    };
  });

  const sortedPlayers = [...processedPlayers].sort((a, b) => {
    if (sortBy === "winRate") {
      return b.penalizedWinRate - a.penalizedWinRate;
    } else if (sortBy === "gamesPlayed") {
      return b.totalGames - a.totalGames;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Results</h1>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "winRate" ? "default" : "outline"}
            onClick={() => setSortBy("winRate")}
            size="sm"
          >
            Win Rate
          </Button>
          <Button
            variant={sortBy === "gamesPlayed" ? "default" : "outline"}
            onClick={() => setSortBy("gamesPlayed")}
            size="sm"
          >
            Games Played
          </Button>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            onClick={() => setSortBy("name")}
            size="sm"
          >
            Name
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlayers.map((player) => (
          <Card key={player.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex justify-between items-center">
                <span>{player.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {player.startYear}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs">Win Rate</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(player.penalizedWinRate * 100)}%
                  </div>
                  {player.penalizedWinRate !== player.winRate && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      <span>
                        {Math.round(player.winRate * 100)}% raw
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Award className="h-4 w-4" />
                    <span className="text-xs">Games</span>
                  </div>
                  <div className="text-2xl font-bold">{player.totalGames}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {player.stats.won}W - {player.stats.lost}L
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
