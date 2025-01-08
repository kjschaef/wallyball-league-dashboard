import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StatCard } from "@/components/StatCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { PlayerCard } from "@/components/PlayerCard";
import { Users, Trophy, Percent, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@db/schema";

const playerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const gameFormSchema = z.object({
  playerOneId: z.string().min(1, "Player is required"),
  playerTwoId: z.string().min(1, "Player is required"),
  playerOneScore: z.coerce.number().min(0),
  playerTwoScore: z.coerce.number().min(0),
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
  const totalGames = players?.reduce(
    (acc, player) => acc + player.games.length,
    0
  ) || 0;

  const totalWins = players?.reduce(
    (acc, player) =>
      acc + player.games.reduce((sum: number, game: any) => sum + (game.won ? 1 : 0), 0),
    0
  ) || 0;

  const winRate = totalGames
    ? ((totalWins / totalGames) * 100).toFixed(1)
    : "0.0";

  const playerForm = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const gameForm = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      playerOneId: "",
      playerTwoId: "",
      playerOneScore: 0,
      playerTwoScore: 0,
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
      toast({ title: "Player created successfully" });
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
      toast({ title: "Player updated successfully" });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/players/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player deleted successfully" });
    },
  });

  const recordGameMutation = useMutation({
    mutationFn: (values: GameFormData) =>
      fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerOneId: parseInt(values.playerOneId),
          playerTwoId: parseInt(values.playerTwoId),
          playerOneScore: values.playerOneScore,
          playerTwoScore: values.playerTwoScore,
        }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setIsGameDialogOpen(false);
      gameForm.reset();
      toast({ title: "Game recorded successfully" });
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">League Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Players"
          value={totalPlayers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Games"
          value={totalGames}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Wins"
          value={totalWins}
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Average Win Rate"
          value={`${winRate}%`}
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players?.map((player) => (
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
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? "Edit Player" : "Add New Player"}
            </DialogTitle>
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
      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Game</DialogTitle>
          </DialogHeader>
          <Form {...gameForm}>
            <form onSubmit={gameForm.handleSubmit(onGameSubmit)} className="space-y-4">
              <FormField
                control={gameForm.control}
                name="playerOneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 1</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {players?.map((player) => (
                          <SelectItem
                            key={player.id}
                            value={player.id.toString()}
                          >
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={gameForm.control}
                name="playerTwoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 2</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {players?.map((player) => (
                          <SelectItem
                            key={player.id}
                            value={player.id.toString()}
                          >
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={gameForm.control}
                name="playerOneScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 1 Score</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={gameForm.control}
                name="playerTwoScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 2 Score</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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