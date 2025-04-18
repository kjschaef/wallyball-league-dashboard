import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { calculatePenalizedWinPercentage } from "@/lib/utils";
import { PlayerPerformanceRadar } from "./PlayerPerformanceRadar";
import type { Player } from "@db/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ExtendedPlayer {
  id: number;
  name: string;
  matches: Array<{ 
    id: number;
    date: string;
    won: boolean;
    isTeamOne: boolean;
    teamOneGamesWon: number;
    teamTwoGamesWon: number;
  }>;
  stats: { won: number; lost: number; totalGames: number; totalMatchTime: number };
  startYear?: number;
}

interface HeadToHeadStats {
  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;
  matchesWith: number;
  matchesAgainst: number;
  winsWith: number;
  winsAgainst: number;
  winRateWith: number;
  winRateAgainst: number;
}

export function AdvancedPlayerDashboard() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [comparisonPlayerId, setComparisonPlayerId] = useState<number | null>(null);

  const { data: players = [] } = useQuery<ExtendedPlayer[]>({
    queryKey: ["/api/players"],
  });

  // Get top performing players (sort by penalized win rate)
  const topPlayers = [...players]
    .map(player => {
      const { penalizedWinRate } = calculatePenalizedWinPercentage(player);
      return { ...player, penalizedWinRate };
    })
    .sort((a, b) => b.penalizedWinRate - a.penalizedWinRate)
    .slice(0, 5);

  // Calculate percentile rankings
  const getPlayerPercentileRank = (playerId: number, metric: 'winRate' | 'gamesPlayed' | 'activity') => {
    if (!playerId || players.length === 0) return "N/A";
    
    const playerValues = players.map(player => {
      if (metric === 'winRate') {
        const { penalizedWinRate } = calculatePenalizedWinPercentage(player);
        return { id: player.id, value: penalizedWinRate };
      } else if (metric === 'gamesPlayed') {
        return { id: player.id, value: player.stats?.totalGames || 0 };
      } else if (metric === 'activity') {
        // Activity is measured by recency of games
        const now = new Date();
        const lastGame = player.matches && player.matches.length > 0 
          ? Math.max(...player.matches.map(m => new Date(m.date).getTime()))
          : 0;
        const daysSinceLastGame = lastGame ? (now.getTime() - lastGame) / (1000 * 60 * 60 * 24) : 1000;
        // Inverse relationship: more recent games = higher activity
        return { id: player.id, value: lastGame ? 100 - Math.min(100, daysSinceLastGame) : 0 };
      }
      return { id: player.id, value: 0 };
    });
    
    // Sort by value descending
    playerValues.sort((a, b) => b.value - a.value);
    
    // Find player's rank
    const playerRank = playerValues.findIndex(p => p.id === playerId) + 1;
    
    // Calculate percentile (higher rank = better percentile)
    const percentile = 100 - ((playerRank - 1) / playerValues.length) * 100;
    
    return `${Math.round(percentile)}%`;
  };

  // Generate head-to-head statistics between players
  const getHeadToHeadStats = (): HeadToHeadStats | null => {
    if (!selectedPlayerId || !comparisonPlayerId || players.length < 2) return null;
    
    const player1 = players.find(p => p.id === selectedPlayerId);
    const player2 = players.find(p => p.id === comparisonPlayerId);
    
    if (!player1 || !player2) return null;
    
    // Find matches where both players participated
    const relevantMatches = player1.matches.filter(match1 => {
      return player2.matches.some(match2 => match2.id === match1.id);
    });
    
    let matchesWith = 0;
    let winsWith = 0;
    let matchesAgainst = 0;
    let winsAgainst = 0;
    
    relevantMatches.forEach(match => {
      const player2Match = player2.matches.find(m => m.id === match.id);
      if (!player2Match) return;
      
      const sameTeam = match.isTeamOne === player2Match.isTeamOne;
      
      if (sameTeam) {
        matchesWith++;
        if (match.won) winsWith++;
      } else {
        matchesAgainst++;
        if (match.won) winsAgainst++;
      }
    });
    
    return {
      player1Id: player1.id,
      player2Id: player2.id,
      player1Name: player1.name,
      player2Name: player2.name,
      matchesWith,
      matchesAgainst,
      winsWith,
      winsAgainst,
      winRateWith: matchesWith ? (winsWith / matchesWith) * 100 : 0,
      winRateAgainst: matchesAgainst ? (winsAgainst / matchesAgainst) * 100 : 0,
    };
  };

  // Calculate performance metrics for a player over time
  const getPerformanceOverTime = (playerId: number | null) => {
    if (!playerId) return [];
    
    const player = players.find(p => p.id === playerId);
    if (!player || !player.matches || player.matches.length === 0) return [];
    
    // Group matches by month
    const matchesByMonth = player.matches.reduce((acc, match) => {
      const date = new Date(match.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          wins: 0,
          losses: 0,
          totalGames: 0,
          winRate: 0,
        };
      }
      
      if (match.won) {
        acc[monthKey].wins++;
      } else {
        acc[monthKey].losses++;
      }
      
      acc[monthKey].totalGames++;
      acc[monthKey].winRate = (acc[monthKey].wins / acc[monthKey].totalGames) * 100;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by month
    return Object.values(matchesByMonth).sort((a, b) => a.month.localeCompare(b.month));
  };

  const headToHeadStats = getHeadToHeadStats();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlayerPerformanceRadar />
        
        <Card>
          <CardHeader>
            <CardTitle>Player Rankings & Percentiles</CardTitle>
            <CardDescription>See how players rank compared to others in the league</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Percentile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPlayers.map((player, index) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{Math.round(player.penalizedWinRate)}%</TableCell>
                      <TableCell>{getPlayerPercentileRank(player.id, 'winRate')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Head-to-Head Analysis</CardTitle>
            <CardDescription>Compare performance when playing with or against another player</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Player</label>
                  <Select 
                    value={selectedPlayerId?.toString() || ""}
                    onValueChange={(value) => setSelectedPlayerId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Compare With</label>
                  <Select 
                    value={comparisonPlayerId?.toString() || ""}
                    onValueChange={(value) => setComparisonPlayerId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players
                        .filter(p => p.id !== selectedPlayerId)
                        .map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {headToHeadStats ? (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-4">
                    {headToHeadStats.player1Name} vs {headToHeadStats.player2Name}
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Playing Together</h4>
                        <p className="text-2xl font-bold">
                          {headToHeadStats.matchesWith > 0 
                            ? `${headToHeadStats.winsWith}W - ${headToHeadStats.matchesWith - headToHeadStats.winsWith}L` 
                            : "No games together"}
                        </p>
                        {headToHeadStats.matchesWith > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {Math.round(headToHeadStats.winRateWith)}% Win Rate
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Playing Against</h4>
                        <p className="text-2xl font-bold">
                          {headToHeadStats.matchesAgainst > 0 
                            ? `${headToHeadStats.winsAgainst}W - ${headToHeadStats.matchesAgainst - headToHeadStats.winsAgainst}L` 
                            : "No games against each other"}
                        </p>
                        {headToHeadStats.matchesAgainst > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {Math.round(headToHeadStats.winRateAgainst)}% Win Rate
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              type: "Together",
                              winRate: Math.round(headToHeadStats.winRateWith),
                              matches: headToHeadStats.matchesWith,
                            },
                            {
                              type: "Against",
                              winRate: Math.round(headToHeadStats.winRateAgainst),
                              matches: headToHeadStats.matchesAgainst,
                            },
                          ]}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 100]} label={{ value: 'Win %', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Games', angle: 90, position: 'insideRight' }} />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="winRate" name="Win Rate %" fill="#8884d8" />
                          <Bar yAxisId="right" dataKey="matches" name="Total Games" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  {selectedPlayerId && comparisonPlayerId
                    ? "No matches found between these players"
                    : "Select two players to view head-to-head statistics"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Track performance changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Player</label>
                <Select 
                  value={selectedPlayerId?.toString() || ""}
                  onValueChange={(value) => setSelectedPlayerId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlayerId ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getPerformanceOverTime(selectedPlayerId)}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`, "Win Rate"]} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="winRate"
                        name="Win Rate"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-muted-foreground">
                  Select a player to view performance trends
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}