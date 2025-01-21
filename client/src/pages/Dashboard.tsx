import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Calendar as CalendarIcon, Share2 } from "lucide-react";
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

  // Get last 5 matches
  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const shareAsImage = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    try {
      // Get computed height of content
      const height = element.getBoundingClientRect().height;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        height: Math.ceil(height),
        windowHeight: Math.ceil(height),
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('dashboard-content');
          if (clonedElement) {
            clonedElement.style.height = `${height}px`;
            clonedElement.style.position = 'relative';
          }
        }
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `volleyball-dashboard-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error creating image:', error);
    }
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
        <PerformanceTrend />

        <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {(() => {
              if (matches.length === 0) {
                return <div className="text-sm text-muted-foreground">No matches found</div>;
              }

              // Find the most recent date that has matches
              const mostRecentDate = matches
                .map(match => new Date(match.date))
                .sort((a, b) => b.getTime() - a.getTime())[0]
                .toDateString();

              return matches
                .filter(match => new Date(match.date).toDateString() === mostRecentDate)
                .map((match) => (
                  <div key={match.id} className="group flex flex-row items-center justify-between py-2 px-3 border-b hover:bg-muted/50 rounded-sm min-h-[3rem]">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-sm text-muted-foreground shrink-0">
                          {format(new Date(match.date), "MMM d")}
                        </span>
                        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 w-full min-w-0">
                          <div className={cn(
                            "font-medium min-w-0 break-words",
                            match.teamOneGamesWon > match.teamTwoGamesWon ? "text-green-600 dark:text-green-500" : ""
                          )}>
                            {formatTeam([match.teamOnePlayerOneId, match.teamOnePlayerTwoId, match.teamOnePlayerThreeId])}
                          </div>
                          <span className="text-sm text-muted-foreground px-2 whitespace-nowrap">vs</span>
                          <div className={cn(
                            "font-medium min-w-0 break-words text-right",
                            match.teamTwoGamesWon > match.teamOneGamesWon ? "text-green-600 dark:text-green-500" : ""
                          )}>
                            {formatTeam([match.teamTwoPlayerOneId, match.teamTwoPlayerTwoId, match.teamTwoPlayerThreeId])}
                          </div>
                        </div>
                      </div>
                    <div className="text-sm font-medium tabular-nums shrink-0 self-end sm:self-center">
                      {match.teamOneGamesWon} - {match.teamTwoGamesWon}
                    </div>
                  </div>
                ))
            })()}
          </div>
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
        onDailyWins={() => setShowDailyWins(true)}
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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