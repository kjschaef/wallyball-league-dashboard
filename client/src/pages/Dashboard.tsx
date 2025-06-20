import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FloatingActionButton } from "../components/FloatingActionButton"; // Relative path
import { Calendar as CalendarIcon, Plus, Minus, Trophy, Percent, Award } from "lucide-react";
import { Button } from "../components/ui/button"; // Relative path
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog"; // Relative path
import { StatCard } from "../components/StatCard"; // Relative path
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form"; // Relative path
import { Input } from "../components/ui/input"; // Relative path
import { useToast } from "../hooks/use-toast"; // Relative path
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"; // Relative path
import type { Player, Match } from "@db/schema"; // Added Match
import { PlayerSelector } from "../components/PlayerSelector"; // Relative path
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover"; // Relative path
import { Calendar } from "../components/ui/calendar"; // Relative path
import { format } from 'date-fns';
import { cn } from "../lib/utils"; // Relative path
import { PerformanceTrend } from "../components/PerformanceTrend"; // Relative path
import { DailyWins } from "../components/DailyWins"; // Relative path

const gameFormSchema = z.object({
  teamOnePlayers: z.array(z.number()).min(1, "At least one player is required").max(3),
  teamTwoPlayers: z.array(z.number()).min(1, "At least one player is required").max(3),
  teamOneGamesWon: z.coerce.number().min(0),
  teamTwoGamesWon: z.coerce.number().min(0),
  date: z.date(),
});

type GameFormData = z.infer<typeof gameFormSchema>;

export default function Dashboard() {
  const [showRecordGame, setShowRecordGame] = useState(false);
  const [showDailyWins, setShowDailyWins] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches = [] } = useQuery<Match[]>({ // Typed query
    queryKey: ["/api/matches"],
  });

  const { data: players = [] } = useQuery<Player[]>({ // Typed query
    queryKey: ["/api/players"],
  });

  // Log API data when it changes
  React.useEffect(() => {
    if (matches.length > 0) {
      console.log("🎯 Matches API data:", matches);
      console.log("🎯 Total matches:", matches.length);
      console.log("🎯 Sample match:", matches[0]);
    }
  }, [matches]);

  React.useEffect(() => {
    if (players.length > 0) {
      console.log("👥 Players API data:", players);
      console.log("👥 Total players:", players.length);
      console.log("👥 Sample player:", players[0]);
    }
  }, [players]);

  const gameForm = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      teamOnePlayers: [],
      teamTwoPlayers: [],
      teamOneGamesWon: 0,
      teamTwoGamesWon: 0,
      date: new Date(),
    },
  });

  const [teamOnePlayers, setTeamOnePlayers] = useState<number[]>([]);
  const [teamTwoPlayers, setTeamTwoPlayers] = useState<number[]>([]);

  const recordGameMutation = useMutation({
    mutationFn: (values: GameFormData) =>
      fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamOnePlayerOneId: values.teamOnePlayers[0] || null,
          teamOnePlayerTwoId: values.teamOnePlayers[1] || null,
          teamOnePlayerThreeId: values.teamOnePlayers[2] || null,
          teamTwoPlayerOneId: values.teamTwoPlayers[0] || null,
          teamTwoPlayerTwoId: values.teamTwoPlayers[1] || null,
          teamTwoPlayerThreeId: values.teamTwoPlayers[2] || null,
          teamOneGamesWon: values.teamOneGamesWon,
          teamTwoGamesWon: values.teamTwoGamesWon,
          date: values.date.toISOString(),
        }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowRecordGame(false);
      gameForm.reset();
      setTeamOnePlayers([]);
      setTeamTwoPlayers([]);
      toast({ 
        title: "Game recorded successfully",
        variant: "success",
      });
    },
  });

  const onGameSubmit = (data: GameFormData) => {
    recordGameMutation.mutate(data);
  };

  const formatTeam = (playerIds: (number | null)[]) => {
    return playerIds
      .filter((id): id is number => id !== null)
      .map(id => players.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  // Get last 5 matches, filtered to most recent day with games
  const recentMatches = [...matches]
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  const mostRecentDayWithGames = recentMatches.length > 0 && recentMatches[0].date ? new Date(recentMatches[0].date).toDateString() : null;

  const filteredMatches = recentMatches.filter(match => match.date && new Date(match.date).toDateString() === mostRecentDayWithGames).slice(0,5);

  // Log the filtering process
  console.log("🔍 Recent matches (sorted):", recentMatches);
  console.log("🔍 Most recent day with games:", mostRecentDayWithGames);
  console.log("🔍 Filtered matches for display:", filteredMatches);


  

  const onAddPlayer = () => {
    window.location.href = '/players';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Wallyball Dashboard</h1>
      </div>

      <div id="dashboard-content">
        <PerformanceTrend />

        <Card>
          <CardHeader>
            <CardTitle>
              {mostRecentDayWithGames 
                ? `Last Games Played - ${format(new Date(mostRecentDayWithGames), "MMM d, yyyy")}`
                : "No Recent Matches"
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMatches.length === 0 ? (
              <p className="text-muted-foreground">No matches found</p>
            ) : (
              <div className="grid gap-2">
                {filteredMatches.map((match) => (
                  <div key={match.id} className="flex flex-col py-1.5 px-3 border-b last:border-b-0 hover:bg-muted/50">
                    <div className="grid grid-cols-1 gap-1.5">
                      <div className={cn(
                          "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium text-sm",
                          match.teamOneGamesWon > match.teamTwoGamesWon ? "text-green-600 dark:text-green-500" : ""
                        )}>
                          <div className="font-bold tabular-nums text-center">
                            {match.teamOneGamesWon}
                          </div>
                          <div className="min-w-0">
                            {formatTeam([match.teamOnePlayerOneId, match.teamOnePlayerTwoId, match.teamOnePlayerThreeId])}
                          </div>
                        </div>
                        {/* Team Two */}
                        <div className={cn(
                          "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium text-sm",
                          match.teamTwoGamesWon > match.teamOneGamesWon ? "text-green-600 dark:text-green-500" : ""
                        )}>
                          <div className="font-bold tabular-nums text-center">
                            {match.teamTwoGamesWon}
                          </div>
                          <div className="min-w-0">
                            {formatTeam([match.teamTwoPlayerOneId, match.teamTwoPlayerTwoId, match.teamTwoPlayerThreeId])}
                          </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDailyWins} onOpenChange={setShowDailyWins}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Daily Wins</DialogTitle>
          </DialogHeader>
          <DailyWins />
        </DialogContent>
      </Dialog>

      <FloatingActionButton
        onRecordGame={() => setShowRecordGame(true)}
      />

      {/* Record Game Dialog */}
      <Dialog 
        open={showRecordGame} 
        onOpenChange={(open) => {
          setShowRecordGame(open);
          if (!open) {
            setTeamOnePlayers([]);
            setTeamTwoPlayers([]);
          }
        }}
        modal={true}
      >
        <DialogContent className="fixed left-[50%] top-[50%] w-[95vw] max-w-3xl translate-x-[-50%] translate-y-[-50%] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="space-y-2 mb-4">
            <DialogTitle className="text-xl">Record Game</DialogTitle>
            <DialogDescription className="text-sm">
              Enter the game details including teams, scores, and date.
            </DialogDescription>
          </DialogHeader>
          <Form {...gameForm}>
            <form onSubmit={gameForm.handleSubmit(onGameSubmit)} className="space-y-6">
              <div className="flex flex-col gap-6">
                <div>
                  <FormField
                    control={gameForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team One */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Team One</h3>
                    <FormField
                      control={gameForm.control}
                      name="teamOnePlayers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Players (up to 3)</FormLabel>
                          <FormControl>
                            <PlayerSelector
                              players={players || []}
                              selectedPlayers={teamOnePlayers}
                              onSelect={(playerId) => {
                                const newSelection = teamOnePlayers.includes(playerId)
                                  ? teamOnePlayers.filter(id => id !== playerId)
                                  : [...teamOnePlayers, playerId];
                                setTeamOnePlayers(newSelection);
                                field.onChange(newSelection);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gameForm.control}
                      name="teamOneGamesWon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Games Won</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4 w-full">
                              <Button 
                                type="button"
                                variant="outline"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => {
                                  const current = field.value || 0;
                                  field.onChange(Math.max(0, current - 1));
                                }}
                              >
                                <Minus className="h-6 w-6" />
                              </Button>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  {...field} 
                                  className="text-center text-lg h-12"
                                />
                              </FormControl>
                              <Button 
                                type="button"
                                variant="outline"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => {
                                  const current = field.value || 0;
                                  field.onChange(current + 1);
                                }}
                              >
                                <Plus className="h-6 w-6" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Team Two */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Team Two</h3>
                    <FormField
                      control={gameForm.control}
                      name="teamTwoPlayers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Players (up to 3)</FormLabel>
                          <FormControl>
                            <PlayerSelector
                              players={players || []}
                              selectedPlayers={teamTwoPlayers}
                              onSelect={(playerId) => {
                                const newSelection = teamTwoPlayers.includes(playerId)
                                  ? teamTwoPlayers.filter(id => id !== playerId)
                                  : [...teamTwoPlayers, playerId];
                                setTeamTwoPlayers(newSelection);
                                field.onChange(newSelection);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={gameForm.control}
                      name="teamTwoGamesWon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Games Won</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4 w-full">
                              <Button 
                                type="button"
                                variant="outline"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => {
                                  const current = field.value || 0;
                                  field.onChange(Math.max(0, current - 1));
                                }}
                              >
                                <Minus className="h-6 w-6" />
                              </Button>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  {...field} 
                                  className="text-center text-lg h-12"
                                />
                              </FormControl>
                              <Button 
                                type="button"
                                variant="outline"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => {
                                  const current = field.value || 0;
                                  field.onChange(current + 1);
                                }}
                              >
                                <Plus className="h-6 w-6" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Record Game
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}