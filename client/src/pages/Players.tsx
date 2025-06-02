
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayerCard } from "../components/PlayerCard"; // Relative path
import { Button } from "../components/ui/button"; // Relative path
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"; // Relative path
import { Input } from "../components/ui/input"; // Relative path
import { Label } from "../components/ui/label"; // Relative path
import { useToast } from "../hooks/use-toast"; // Relative path
import { calculatePenalizedWinPercentage } from "../lib/utils"; // Relative path
import type { Player } from "@db/schema";

// Extended player type that includes the data we receive from the API
interface ExtendedPlayer extends Player {
  matches: Array<{ won: boolean, date: string }>;
  stats: { won: number, lost: number };
}

export default function Players() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    player: Player | null;
  }>({
    isOpen: false,
    player: null,
  });
  
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players } = useQuery<ExtendedPlayer[]>({
    queryKey: ["/api/players"]
  });

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
        <Button onClick={() => openDialog()}>Add Player</Button>
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
                  defaultValue={dialogState.player?.startYear?.toString() || ''}
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
        {players && [...players]
          .sort((a, b) => {
            // Calculate win percentages with inactivity penalty applied using the utility function
            const { penalizedWinRate: aWinRate } = calculatePenalizedWinPercentage(a);
            const { penalizedWinRate: bWinRate } = calculatePenalizedWinPercentage(b);
            
            // Sort by penalized win percentage (highest first)
            return bWinRate - aWinRate;
          })
          .map((player) => (
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
