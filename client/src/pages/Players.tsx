
import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayerCard } from "@/components/PlayerCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@db/schema";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function Players() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    player: Player | null;
  }>({
    isOpen: false,
    player: null,
  });
  
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  type PlayerWithStats = Player & { 
    matches: Array<{ won: boolean, date: string }>, 
    stats: { won: number, lost: number } 
  };

  const { data: players } = useQuery<PlayerWithStats[]>({
    queryKey: ["/api/players"],
  });
  
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => {
      // Calculate win percentage for each player
      const aTotal = a.stats.won + a.stats.lost;
      const bTotal = b.stats.won + b.stats.lost;
      
      const aWinRate = aTotal > 0 ? Math.round((a.stats.won / aTotal) * 100) : 0;
      const bWinRate = bTotal > 0 ? Math.round((b.stats.won / bTotal) * 100) : 0;
      
      // Sort by win percentage
      return sortOrder === "desc" ? bWinRate - aWinRate : aWinRate - bWinRate;
    });
  }, [players, sortOrder]);

  const createMutation = useMutation({
    mutationFn: (newPlayer: Partial<Player>) =>
      fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlayer),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      closeDialog();
      toast({ title: "Player created successfully" });
    },
  });

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

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/players/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player deleted successfully" });
    },
  });

  const closeDialog = () => {
    setDialogState({ isOpen: false, player: null });
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const openDialog = (player?: Player) => {
    setDialogState({ 
      isOpen: true, 
      player: player || null 
    });
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
    } else {
      createMutation.mutate(playerData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Players</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="sort-order">Sort by Win %:</Label>
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Highest First</SelectItem>
                <SelectItem value="asc">Lowest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => openDialog()}>Add Player</Button>
        </div>
      </div>

      <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.player ? "Edit Player" : "Add New Player"}
            </DialogTitle>
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
                  defaultValue={dialogState.player?.startYear as number | undefined}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="w-full" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                {dialogState.player ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={(player) => openDialog(player)}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
