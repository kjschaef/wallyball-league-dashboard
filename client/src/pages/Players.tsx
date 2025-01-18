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

export default function Players() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const addFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
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
      setShowAddDialog(false);
      if (addFormRef.current) {
        addFormRef.current.reset();
      }
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
      setEditingPlayer(null);
      if (editFormRef.current) {
        editFormRef.current.reset();
      }
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

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPlayer) return;

    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      ...editingPlayer,
      name: formData.get("name") as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Players</h1>
        <Button onClick={() => setShowAddDialog(true)}>Add Player</Button>
      </div>

      {/* Add Player Dialog */}
      <Dialog 
        open={showAddDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            if (addFormRef.current) {
              addFormRef.current.reset();
            }
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <form ref={addFormRef} onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                name="name"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog 
        open={!!editingPlayer} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlayer(null);
            if (editFormRef.current) {
              editFormRef.current.reset();
            }
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <form ref={editFormRef} onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                required
                defaultValue={editingPlayer?.name || ""}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setEditingPlayer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players?.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={(player) => setEditingPlayer(player)}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}