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

const matchFormSchema = z.object({
  playerId: z.string(),
  won: z.coerce.number().min(0),
  lost: z.coerce.number().min(0),
});

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

  const matchForm = useForm<MatchFormData>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      playerId: "",
      won: 0,
      lost: 0,
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: (newPlayer: { name: string }) =>
      fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlayer),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setIsPlayerDialogOpen(false);
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
          playerId: parseInt(values.playerId),
          won: values.won,
          lost: values.lost,
        }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setIsMatchDialogOpen(false);
      matchForm.reset();
      toast({ title: "Match recorded successfully" });
    },
  });

  const handlePlayerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const playerData = {
      name: formData.get("name") as string,
    };

    if (editingPlayer) {
      updatePlayerMutation.mutate({ ...editingPlayer, ...playerData });
    } else {
      createPlayerMutation.mutate(playerData);
    }
  };

  const handleMatchSubmit = (values: MatchFormData) => {
    recordMatchMutation.mutate(values);
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
              setIsPlayerDialogOpen(true);
            }}
            onDelete={(id) => deletePlayerMutation.mutate(id)}
          />
        ))}
      </div>

      <FloatingActionButton
        onAddPlayer={() => {
          setEditingPlayer(null);
          setIsPlayerDialogOpen(true);
        }}
        onRecordMatch={() => setIsMatchDialogOpen(true)}
      />

      {/* Add/Edit Player Dialog */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? "Edit Player" : "Add New Player"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePlayerSubmit} className="space-y-4">
            <div className="space-y-2">
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input
                id="name"
                name="name"
                required
                defaultValue={editingPlayer?.name}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingPlayer ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Match Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Match</DialogTitle>
          </DialogHeader>
          <Form {...matchForm}>
            <form onSubmit={matchForm.handleSubmit(handleMatchSubmit)} className="space-y-4">
              <FormField
                control={matchForm.control}
                name="playerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a player" />
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
                name="won"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sets Won</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={matchForm.control}
                name="lost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sets Lost</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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