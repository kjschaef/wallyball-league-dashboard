
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Player } from "@db/schema";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfYear, endOfYear } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { calculatePenalizedWinPercentage } from "@/lib/utils";
import cn from 'classnames';
import { queryClient } from '@/lib/queryClient';

interface MatchResult {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export default function Results() {
  const [showTotalTime, setShowTotalTime] = useState(false);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    player: Player | null;
  }>({
    isOpen: false,
    player: null,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const { data: matches = [] } = useQuery<MatchResult[]>({
    queryKey: ["/api/matches"],
  });

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (player: Player) =>
      fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      closeDialog();
      toast({ title: "Player updated successfully" });
    },
  });

  const closeDialog = () => {
    setDialogState({ isOpen: false, player: null });
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const playerData = {
      name: formData.get("name") as string,
      startYear: formData.get("startYear") ? parseInt(formData.get("startYear") as string) : null,
    };

    if (dialogState.player) {
      updateMutation.mutate({ ...dialogState.player, ...playerData });
    }
  };

  const today = new Date();
  const seasonStart = startOfYear(today);
  const seasonEnd = endOfYear(today);

  const seasonMatches = matches.filter((match) => {
    const matchDate = new Date(match.date);
    return matchDate >= seasonStart && matchDate <= seasonEnd;
  });

  const seasonStats = seasonMatches.reduce(
    (acc, match) => {
      return {
        totalMatches: acc.totalMatches + 1,
        totalGames:
          acc.totalGames + match.teamOneGamesWon + match.teamTwoGamesWon,
        averageGamesPerMatch:
          (acc.totalGames + match.teamOneGamesWon + match.teamTwoGamesWon) /
          (acc.totalMatches + 1),
      };
    },
    { totalMatches: 0, totalGames: 0, averageGamesPerMatch: 0 },
  );

  const formatTeam = (players: string[]) => {
    if (players.length === 0) return "No players";
    if (players.length === 1) return players[0];
    if (players.length === 2) return `${players[0]} and ${players[1]}`;
    return `${players[0]}, ${players[1]} and ${players[2]}`;
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/players/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player deleted successfully" });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Results & Standings</h1>

      <Dialog
        open={dialogState.isOpen}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={dialogState.player?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startYear">Start Year</Label>
                <Input
                  id="startYear"
                  name="startYear"
                  type="number"
                  min="1900"
                  max="2100"
                  defaultValue={dialogState.player?.startYear || ''}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
              <p className="text-sm text-muted-foreground">
                Avg Games per Match
              </p>
              <p className="text-2xl font-bold">
                {seasonStats.averageGamesPerMatch.toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Best Performing Teams (Min. 6 Games)</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-muted-foreground">No matches recorded yet</p>
            ) : (
              <div className="mt-6">
                  {(() => {
                    const teamStats = Object.entries(
                      matches.reduce(
                        (acc, match) => {
                          const teamOne = formatTeam([...match.teamOnePlayers].sort());
                          const teamTwo = formatTeam([...match.teamTwoPlayers].sort());

                          if (!acc[teamOne]) {
                            acc[teamOne] = { wins: 0, losses: 0, winRate: 0 };
                          }
                          acc[teamOne].wins += match.teamOneGamesWon;
                          acc[teamOne].losses += match.teamTwoGamesWon;
                          acc[teamOne].winRate =
                            acc[teamOne].wins / (acc[teamOne].wins + acc[teamOne].losses);

                          if (!acc[teamTwo]) {
                            acc[teamTwo] = { wins: 0, losses: 0, winRate: 0 };
                          }
                          acc[teamTwo].wins += match.teamTwoGamesWon;
                          acc[teamTwo].losses += match.teamOneGamesWon;
                          acc[teamTwo].winRate =
                            acc[teamTwo].wins / (acc[teamTwo].wins + acc[teamTwo].losses);

                          return acc;
                        },
                        {} as Record<string, { wins: number; losses: number; winRate: number }>
                      )
                    )
                      .filter(([_, stats]) => stats.wins + stats.losses >= 6)
                      .sort((a, b) => b[1].winRate - a[1].winRate)
                      .slice(0, 5);

                    return (
                      <>
                        <div className="mb-4">
                          {teamStats.map(([team, stats]) => (
                            <div
                              key={team}
                              className="flex justify-between items-center bg-muted/40 p-2 rounded mb-1"
                            >
                              <span className="font-medium">{team}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm">
                                  {stats.wins}W - {stats.losses}L
                                </span>
                                <span
                                  className={cn(
                                    "font-bold",
                                    stats.winRate > 0.55 ? "text-green-600" : stats.winRate < 0.45 ? "text-red-600" : ""
                                  )}
                                >
                                  {(stats.winRate * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
            )}
          </CardContent>
        </Card>

      {/* Player Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players
          ?.sort((a, b) => {
            const { penalizedWinRate: aWinRate } = calculatePenalizedWinPercentage(a);
            const { penalizedWinRate: bWinRate } = calculatePenalizedWinPercentage(b);
            return bWinRate - aWinRate;
          })
          .map((player) => {
            const sortedPlayer = {
              ...player,
              matches: [...(player.matches || [])].sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              )
            };
            
            return (
              <PlayerCard
                key={player.id}
                player={sortedPlayer}
                onEdit={(player) => setDialogState({ isOpen: true, player })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            );
          })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Playing Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="min-h-[400px] relative pb-4">
              {players?.sort((a, b) => (b.stats.totalMatchTime || 0) - (a.stats.totalMatchTime || 0))
                .map((player, i) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-2 mb-2"
                  title={`Total playing time: ${player.stats.totalMatchTime} hours\nBased on 90-minute daily sessions`}
                >
                  <div className="w-24 truncate">{player.name}</div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ 
                        width: `${(player.stats.totalMatchTime / Math.max(...players.map(p => p.stats.totalMatchTime || 0))) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    {player.stats.totalMatchTime}h
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievement Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🏐
              </div>
              <span className="text-sm">First Game Played</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🏆
              </div>
              <span className="text-sm">Won 5 Games</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🗓️
              </div>
              <span className="text-sm">Played 10 Games</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🎯
              </div>
              <span className="text-sm">70% Win Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                👥
              </div>
              <span className="text-sm">Played with 5 Different Teammates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                👑
              </div>
              <span className="text-sm">Perfect Game Victory</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Common Team Matchups</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-muted-foreground">No matches recorded yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  matches.reduce(
                    (acc, match) => {
                      const teamOne = formatTeam([...match.teamOnePlayers].sort());
                      const teamTwo = formatTeam([...match.teamTwoPlayers].sort());
                      const matchupKey = [teamOne, teamTwo].sort().join(" vs ");

                      if (!acc[matchupKey]) {
                        acc[matchupKey] = {
                          count: 0,
                          teamOneWins: 0,
                          teamTwoWins: 0,
                          totalGames: 0,
                        };
                      }

                      acc[matchupKey].count += 1;
                      acc[matchupKey].teamOneWins += match.teamOneGamesWon;
                      acc[matchupKey].teamTwoWins += match.teamTwoGamesWon;
                      acc[matchupKey].totalGames +=
                        match.teamOneGamesWon + match.teamTwoGamesWon;

                      return acc;
                    },
                    {} as Record<
                      string,
                      {
                        count: number;
                        teamOneWins: number;
                        teamTwoWins: number;
                        totalGames: number;
                      }
                    >,
                  ),
                )
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 5)
                  .map(([matchup, stats]) => (
                    <div
                      key={matchup}
                      className="flex flex-col p-2 hover:bg-muted/50 rounded"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {(() => {
                            const teams = matchup.split(" vs ");
                            const teamOneWins = stats.teamOneWins;
                            const teamTwoWins = stats.teamTwoWins;
                            const teamWithMoreWins = teamOneWins > teamTwoWins ? 0 : 
                                                   teamTwoWins > teamOneWins ? 1 : -1;

                            if (teamWithMoreWins === 0) {
                              return (
                                <>
                                  <span className="text-green-600 font-semibold">
                                    {teams[0]}
                                  </span>
                                  <span className="mx-1">vs</span>
                                  <span>
                                    {teams[1]}
                                  </span>
                                </>
                              );
                            } else if (teamWithMoreWins === 1) {
                              return (
                                <>
                                  <span>
                                    {teams[0]}
                                  </span>
                                  <span className="mx-1">vs</span>
                                  <span className="text-green-600 font-semibold">
                                    {teams[1]}
                                  </span>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <span>
                                    {teams[0]}
                                  </span>
                                  <span className="mx-1">vs</span>
                                  <span>
                                    {teams[1]}
                                  </span>
                                </>
                              );
                            }
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Played {stats.count} times
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <div>
                          {(() => {
                            const teamOneWins = stats.teamOneWins;
                            const teamTwoWins = stats.teamTwoWins;
                            const teamWithMoreWins = teamOneWins > teamTwoWins ? 0 : teamTwoWins > teamOneWins ? 1 : -1;
                            if (teamWithMoreWins === 0) {
                              return (
                                <>
                                  Record: <span className="text-green-600">{teamOneWins}</span>-{teamTwoWins}
                                </>
                              );
                            } else if (teamWithMoreWins === 1) {
                              return (
                                <>
                                  Record: <span className="text-green-600">{teamTwoWins}</span>-{teamOneWins}
                                </>
                              );
                            } else {
                              return (
                                <>
                                  Record: {teamOneWins}-{teamTwoWins} (Tied)
                                </>
                              );
                            }
                          })()}
                        </div>
                        <div>
                          Average games per match:{" "}
                          {(stats.totalGames / stats.count).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
