import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayerCard } from "@/components/PlayerCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@db/schema";
import { AddPlayerDialog } from "@/components/AddPlayerDialog";
import { EditPlayerDialog } from "@/components/EditPlayerDialog";

export default function Players() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/players/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "Player deleted successfully" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Players</h1>
        <Button onClick={() => setShowAddDialog(true)}>Add Player</Button>
      </div>

      <AddPlayerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />

      <EditPlayerDialog 
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players?.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={setEditingPlayer}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}