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

const matchFormSchema = z.object({
  team1Player1Id: z.string().min(1, "Player is required"),
  team1Player2Id: z.string().min(1, "Player is required"),
  team2Player1Id: z.string().min(1, "Player is required"),
  team2Player2Id: z.string().min(1, "Player is required"),
  team1Score: z.coerce.number().min(0),
  team2Score: z.coerce.number().min(0),
});

type PlayerFormData = z.infer<typeof playerFormSchema>;
type MatchFormData = z.infer<typeof matchFormSchema>;

export default function Dashboard() {
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const totalPlayers = players?.length || 0;
  const totalMatches = players?.reduce(
    (acc, player) => acc + player.matches.length,
    0
  ) || 0;

  const totalWins = players?.reduce(
    (acc, player) =>
      acc + player.matches.reduce((sum: number, match: any) => sum + match.won, 0),
    0
  ) || 0;

  const winRate = totalMatches
    ? ((totalWins / totalMatches) * 100).toFixed(1)
    : "0.0";

  const playerForm = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const matchForm = useForm<MatchFormData>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      team1Player1Id: "",
      team1Player2Id: "",
      team2Player1Id: "",
      team2Player2Id: "",
      team1Score: 0,
      team2Score: 0,
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

  const recordMatchMutation = useMutation({
    mutationFn: (values: MatchFormData) =>
      fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1Player1Id: parseInt(values.team1Player1Id),
          team1Player2Id: parseInt(values.team1Player2Id),
          team2Player1Id: parseInt(values.team2Player1Id),
          team2Player2Id: parseInt(values.team2Player2Id),
          team1Score: values.team1Score,
          team2Score: values.team2Score,
        }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setIsMatchDialogOpen(false);
      matchForm.reset();
      toast({ title: "Match recorded successfully" });
    },
  });

  const onPlayerSubmit = (data: PlayerFormData) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({ ...editingPlayer, ...data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const onMatchSubmit = (data: MatchFormData) => {
    recordMatchMutation.mutate(data);
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
          title="Total Matches"
          value={totalMatches}
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
        onRecordMatch={() => {
          matchForm.reset();
          setIsMatchDialogOpen(true);
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

      {/* Record Match Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Match</DialogTitle>
          </DialogHeader>
          <Form {...matchForm}>
            <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Team 1 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Team 1</h3>
                  <FormField
                    control={matchForm.control}
                    name="team1Player1Id"
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
                    control={matchForm.control}
                    name="team1Player2Id"
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
                    control={matchForm.control}
                    name="team1Score"
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

                {/* Team 2 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Team 2</h3>
                  <FormField
                    control={matchForm.control}
                    name="team2Player1Id"
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
                    control={matchForm.control}
                    name="team2Player2Id"
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
                    control={matchForm.control}
                    name="team2Score"
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
                Record Match
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}