"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function PlayerAnalytics() {
  const [selectedPlayer1, setSelectedPlayer1] = useState<number | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<number | null>(null);

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
    queryFn: () => fetch("/api/players").then(res => res.json())
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["/api/matches"],
    queryFn: () => fetch("/api/matches").then(res => res.json())
  });

  const calculatePerformanceMetrics = (playerId: number) => {
    const player = players.find((p: any) => p.id === playerId);
    if (!player) return null;

    const { stats, matches: playerMatches } = player;
    const totalGames = stats.won + stats.lost;
    
    const winRate = totalGames > 0 ? (stats.won / totalGames) * 100 : 0;
    
    const consistency = Math.min(100, totalGames > 10 ? 60 + (totalGames / 5) : totalGames * 6);
    
    const sortedMatches = [...playerMatches].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const recentMatches = sortedMatches.slice(0, 10);
    const olderMatches = sortedMatches.slice(10, 20);
    
    const recentWinRate = recentMatches.length > 0
      ? (recentMatches.filter((m: any) => m.won).length / recentMatches.length) * 100
      : 0;
      
    const olderWinRate = olderMatches.length > 0
      ? (olderMatches.filter((m: any) => m.won).length / olderMatches.length) * 100
      : 0;
    
    const improvement = Math.min(100, Math.max(0, 50 + (recentWinRate - olderWinRate)));
    
    const mostGamesPlayed = Math.max(...players.map((p: any) => p.stats.won + p.stats.lost));
    const volume = mostGamesPlayed > 0 
      ? (totalGames / mostGamesPlayed) * 100 
      : 0;
    
    return [
      { subject: "Win Rate", A: Math.round(winRate) },
      { subject: "Consistency", A: Math.round(consistency) },
      { subject: "Improvement", A: Math.round(improvement) },
      { subject: "Volume", A: Math.round(volume) },
    ];
  };

  const getHeadToHeadStats = () => {
    if (!selectedPlayer1 || !selectedPlayer2) return null;
    
    const player1 = players.find((p: any) => p.id === selectedPlayer1);
    const player2 = players.find((p: any) => p.id === selectedPlayer2);
    
    if (!player1 || !player2) return null;
    
    const headToHeadMatches = matches.filter((match: any) => {
      const player1InTeam1 = [
        match.teamOnePlayerOneId,
        match.teamOnePlayerTwoId,
        match.teamOnePlayerThreeId,
      ].includes(selectedPlayer1);
      
      const player1InTeam2 = [
        match.teamTwoPlayerOneId,
        match.teamTwoPlayerTwoId,
        match.teamTwoPlayerThreeId,
      ].includes(selectedPlayer1);
      
      const player2InTeam1 = [
        match.teamOnePlayerOneId,
        match.teamOnePlayerTwoId,
        match.teamOnePlayerThreeId,
      ].includes(selectedPlayer2);
      
      const player2InTeam2 = [
        match.teamTwoPlayerOneId,
        match.teamTwoPlayerTwoId,
        match.teamTwoPlayerThreeId,
      ].includes(selectedPlayer2);
      
      return (
        (player1InTeam1 && player2InTeam2) || 
        (player1InTeam2 && player2InTeam1)
      );
    });
    
    const player1Wins = headToHeadMatches.filter((match: any) => {
      const player1InTeam1 = [
        match.teamOnePlayerOneId,
        match.teamOnePlayerTwoId,
        match.teamOnePlayerThreeId,
      ].includes(selectedPlayer1);
      
      return (
        (player1InTeam1 && match.teamOneGamesWon > match.teamTwoGamesWon) ||
        (!player1InTeam1 && match.teamTwoGamesWon > match.teamOneGamesWon)
      );
    }).length;
    
    const totalMatches = headToHeadMatches.length;
    const player2Wins = totalMatches - player1Wins;
    
    return {
      player1Name: player1.name,
      player2Name: player2.name,
      player1Wins,
      player2Wins,
      totalMatches,
    };
  };

  const player1Metrics = selectedPlayer1 ? calculatePerformanceMetrics(selectedPlayer1) : null;
  const player2Metrics = selectedPlayer2 ? calculatePerformanceMetrics(selectedPlayer2) : null;
  const headToHeadStats = getHeadToHeadStats();

  const radarData = player1Metrics && player2Metrics
    ? player1Metrics.map((item, index) => ({
        subject: item.subject,
        A: item.A,
        B: player2Metrics[index].A,
      }))
    : player1Metrics
    ? player1Metrics
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Player Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Player 1</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedPlayer1 || ""}
            onChange={(e) => setSelectedPlayer1(Number(e.target.value) || null)}
          >
            <option value="">Select Player</option>
            {players.map((player: any) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Player 2</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedPlayer2 || ""}
            onChange={(e) => setSelectedPlayer2(Number(e.target.value) || null)}
          >
            <option value="">Select Player</option>
            {players.map((player: any) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(selectedPlayer1 || selectedPlayer2) && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={150} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  {selectedPlayer1 && (
                    <Radar
                      name={players.find((p: any) => p.id === selectedPlayer1)?.name}
                      dataKey="A"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.2}
                    />
                  )}
                  {selectedPlayer2 && (
                    <Radar
                      name={players.find((p: any) => p.id === selectedPlayer2)?.name}
                      dataKey="B"
                      stroke="#16a34a"
                      fill="#16a34a"
                      fillOpacity={0.2}
                    />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {headToHeadStats && (
        <Card>
          <CardHeader>
            <CardTitle>Head-to-Head Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{headToHeadStats.player1Wins}</div>
                <div className="text-sm text-muted-foreground">{headToHeadStats.player1Name}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">vs</div>
                <div className="text-xs text-muted-foreground">
                  {headToHeadStats.totalMatches} matches
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{headToHeadStats.player2Wins}</div>
                <div className="text-sm text-muted-foreground">{headToHeadStats.player2Name}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
