
import { useState, useRef } from "react";
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
            // Calculate inactivity periods
            const today = new Date();
            const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
            const maxPenalty = 0.5; // 50% maximum penalty
            const penaltyPerWeek = 0.05; // 5% penalty per week after grace period
            
            // Determine the last match date for each player
            const aLastMatch = a.matches && a.matches.length > 0 
              ? new Date(a.matches[a.matches.length - 1].date) 
              : (a.createdAt ? new Date(a.createdAt) : new Date());
            const bLastMatch = b.matches && b.matches.length > 0 
              ? new Date(b.matches[b.matches.length - 1].date) 
              : (b.createdAt ? new Date(b.createdAt) : new Date());
            
            // Calculate inactivity time in milliseconds
            const aInactiveTime = today.getTime() - aLastMatch.getTime();
            const bInactiveTime = today.getTime() - bLastMatch.getTime();
            
            // Calculate penalties (no penalty for first 2 weeks, then 5% per week up to 50%)
            const aExcessInactiveTime = Math.max(0, aInactiveTime - twoWeeksInMs);
            const bExcessInactiveTime = Math.max(0, bInactiveTime - twoWeeksInMs);
            
            const aWeeksInactive = Math.floor(aExcessInactiveTime / (7 * 24 * 60 * 60 * 1000));
            const bWeeksInactive = Math.floor(bExcessInactiveTime / (7 * 24 * 60 * 60 * 1000));
            
            const aPenalty = Math.min(maxPenalty, aWeeksInactive * penaltyPerWeek);
            const bPenalty = Math.min(maxPenalty, bWeeksInactive * penaltyPerWeek);
            
            // Calculate total games for each player
            const aTotal = a.stats.won + a.stats.lost;
            const bTotal = b.stats.won + b.stats.lost;
            
            // Calculate win percentages with penalty applied
            const aBaseWinRate = aTotal > 0 ? (a.stats.won / aTotal) * 100 : 0;
            const bBaseWinRate = bTotal > 0 ? (b.stats.won / bTotal) * 100 : 0;
            
            const aWinRate = aBaseWinRate * (1 - aPenalty);
            const bWinRate = bBaseWinRate * (1 - bPenalty);
            
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
