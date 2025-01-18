import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@db/schema";

interface EditPlayerDialogProps {
  player: Player | null;
  onClose: () => void;
}

export function EditPlayerDialog({ player, onClose }: EditPlayerDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (updatedPlayer: Player) =>
      fetch(`/api/players/${updatedPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlayer),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      onClose();
      if (formRef.current) {
        formRef.current.reset();
      }
      toast({ title: "Player updated successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!player) return;

    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      ...player,
      name: formData.get("name") as string,
    });
  };

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update the player's information below.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              name="name"
              required
              defaultValue={player?.name}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={onClose}
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
  );
}
