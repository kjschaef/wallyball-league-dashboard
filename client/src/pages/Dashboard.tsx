import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Calendar as CalendarIcon, Share2, Plus, Minus } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Player } from "@db/schema";
import { PlayerSelector } from "@/components/PlayerSelector";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { PerformanceTrend } from "@/components/PerformanceTrend";
import { DailyWins } from "@/components/DailyWins";

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
  const [isExporting, setIsExporting] = useState(false); // Added state for export

  const { data: matches = [] } = useQuery({
    queryKey: ["/api/matches"],
  });

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
  });

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
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const mostRecentDayWithGames = recentMatches.length > 0 ? new Date(recentMatches[0].date).toLocaleDateString() : null;

  const filteredMatches = recentMatches.filter(match => new Date(match.date).toLocaleDateString() === mostRecentDayWithGames).slice(0,5);


  const shareAsImage = async () => {
    let originalWidth = '';
    try {
      setIsExporting(true);
      const element = document.getElementById('dashboard-content');
      if (!element) return;

      // Save original width and get computed height
      originalWidth = element.style.width;
      const height = element.getBoundingClientRect().height;

      // Set export width
      element.style.width = '1200px';
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 1200, // Standard width
        height: Math.ceil(height),
        windowWidth: 1200,
        windowHeight: Math.ceil(height),
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('dashboard-content');
          if (clonedElement) {
            clonedElement.style.width = '1200px';
            clonedElement.style.height = `${height}px`;
            clonedElement.style.position = 'relative';
          }
        }
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast({
              title: "Image copied to clipboard",
              variant: "success",
            });
          } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback to download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `volleyball-dashboard-${format(new Date(), 'yyyy-MM-dd')}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            toast({
              title: "Image downloaded (clipboard access denied)",
              variant: "default",
            });
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error creating image:', error);
    } finally {
      // Restore original width and reset export state
      const element = document.getElementById('dashboard-content');
      if (element) {
        element.style.width = originalWidth;
      }
      setIsExporting(false);
    }
  };

  const onAddPlayer = () => {
    window.location.href = '/players';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Wallyball Dashboard</h1>
        <Button onClick={shareAsImage} variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share as Image
        </Button>
      </div>

      <div id="dashboard-content">
        <PerformanceTrend isExporting={isExporting} /> {/* Pass isExporting prop */}

        <Card>
          <CardHeader>
            <CardTitle>Recent Matches - {mostRecentDayWithGames ? format(new Date(mostRecentDayWithGames), "MMM d, yyyy") : "No matches"}</CardTitle>
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