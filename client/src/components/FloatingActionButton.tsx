import React from 'react';
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FloatingActionButtonProps {
  onRecordGame: () => void;
}

export function FloatingActionButton({
  onRecordGame,
}: FloatingActionButtonProps) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPlayerMutation = useMutation({
    mutationFn: (newPlayer: { name: string }) =>
      fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlayer),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowAddPlayer(false);
      toast({ title: "Player created successfully" });
    },
  });

  const handleAddPlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    createPlayerMutation.mutate({ name });
    form.reset();
  };

  return (
    <div className="fixed bottom-6 right-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="h-14 w-14 rounded-full" data-testid="fab-trigger">
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setShowAddPlayer(true)}>
            Add Player
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRecordGame}>
            Record Match
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPlayer}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <Button type="submit" className="w-full">Add Player</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
