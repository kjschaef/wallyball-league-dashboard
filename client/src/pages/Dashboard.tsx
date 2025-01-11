import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StatCard } from "@/components/StatCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { PlayerCard } from "@/components/PlayerCard";
import { Users, Calendar as CalendarIcon } from "lucide-react";
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
import type { Player } from "@db/schema";
import { PlayerSelector } from "@/components/PlayerSelector";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { PerformanceTrend } from "@/components/PerformanceTrend";


const playerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const gameFormSchema = z.object({
  teamOnePlayers: z.array(z.number()).min(1, "At least one player is required").max(3),
  teamTwoPlayers: z.array(z.number()).min(1, "At least one player is required").max(3),
  teamOneGamesWon: z.coerce.number().min(0),
  teamTwoGamesWon: z.coerce.number().min(0),
  date: z.date(),
});

type PlayerFormData = z.infer<typeof playerFormSchema>;
type GameFormData = z.infer<typeof gameFormSchema>;

export default function Dashboard() {
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const totalPlayers = players?.length || 0;
  const totalGames = players?.reduce((acc, player) => {
    return acc + player.matches?.reduce((matchAcc, match) => 
      matchAcc + (match.teamOneGamesWon + match.teamTwoGamesWon)
    , 0) / players.length;
  }, 0) || 0;

  const playerForm = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
    },
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

  const createPlayerMutation = useMutation({
    mutationFn: (data: PlayerFormData) =>
      fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setIsPlayerDialogOpen(false);
      playerForm.reset();
      toast({ 
        title: "Player created successfully",
        variant: "success",
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (player: Player) =>
      fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setIsPlayerDialogOpen(false);
      setEditingPlayer(null);
      playerForm.reset();
      toast({ 
        title: "Player updated successfully",
        variant: "success",
      });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/players/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ 
        title: "Player deleted successfully",
        variant: "success",
      });
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
      setIsGameDialogOpen(false);
      gameForm.reset();
      setTeamOnePlayers([]);
      setTeamTwoPlayers([]);
      toast({ 
        title: "Game recorded successfully",
        variant: "success",
      });
    },
  });

  const onPlayerSubmit = (data: PlayerFormData) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({ ...editingPlayer, ...data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const onGameSubmit = (data: GameFormData) => {
    recordGameMutation.mutate(data);
  };

  // Extract all games from players data
  const allGames = players?.reduce<Array<any>>((acc, player) => {
    const playerGames = player.games || [];
    return [...acc, ...playerGames];
  }, []) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Wallyball Standings</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Total Players"
          value={totalPlayers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          className="p-4"
        />
        <StatCard
          title="Total Games"
          value={totalGames}
          icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
          className="p-4"
        />
      </div>

      {/* Add Performance Trend */}
      <PerformanceTrend />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players?.sort((a, b) => {
          const aWinsPerDay = a.stats.won / (new Set(a.matches.map((m: any) => new Date(m.date).toLocaleDateString())).size || 1);
          const bWinsPerDay = b.stats.won / (new Set(b.matches.map((m: any) => new Date(m.date).toLocaleDateString())).size || 1);
          return bWinsPerDay - aWinsPerDay;
        }).map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={(player) => {
              setEditingPlayer(player);
              playerForm.reset({ name: player.name });
              setIsPlayerDialogOpen(true);
            }}
            onDelete={(id) => deletePlayerMutation.mutate(id)}
          />
        ))}
      </div>

      <FloatingActionButton
        onAddPlayer={() => {
          setEditingPlayer(null);
          playerForm.reset();
          setIsPlayerDialogOpen(true);
        }}
        onRecordGame={() => {
          gameForm.reset();
          setIsGameDialogOpen(true);
        }}
      />

      {/* Add/Edit Player Dialog */}
      <Dialog 
        open={isPlayerDialogOpen} 
        onOpenChange={setIsPlayerDialogOpen}
        modal={true}
      >
        <DialogContent className="fixed left-[50%] top-[40%]">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? "Edit Player" : "Add New Player"}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer ? "Update the player's information below." : "Enter the new player's information below."}
            </DialogDescription>
          </DialogHeader>
          <Form {...playerForm}>
            <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-4">
              <FormField
                control={playerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {editingPlayer ? "Update" : "Create"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Record Game Dialog */}
      <Dialog 
        open={isGameDialogOpen} 
        onOpenChange={(open) => {
          setIsGameDialogOpen(open);
          if (!open) {
            setTeamOnePlayers([]);
            setTeamTwoPlayers([]);
          }
        }}
        modal={true}
      >
        <DialogContent className="fixed left-[50%] top-[50%] w-[95vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto max-h-[90vh] p-4 md:p-6">
          <DialogHeader className="space-y-2 mb-4">
            <DialogTitle className="text-xl">Record Game</DialogTitle>
            <DialogDescription className="text-sm">
              Enter the game details including teams, scores, and date.
            </DialogDescription>
          </DialogHeader>
          <Form {...gameForm}>
            <form onSubmit={gameForm.handleSubmit(onGameSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="col-span-2">
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