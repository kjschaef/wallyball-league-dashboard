import { useEffect } from "react";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface EditPlayerDialogProps {
  player: Player | null;
  onClose: () => void;
}

const editPlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type EditPlayerFormData = z.infer<typeof editPlayerSchema>;

export function EditPlayerDialog({ player, onClose }: EditPlayerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditPlayerFormData>({
    resolver: zodResolver(editPlayerSchema),
    defaultValues: {
      name: player?.name || "",
    },
  });

  // Update form when player changes
  useEffect(() => {
    if (player) {
      form.reset({ name: player.name });
    } else {
      form.reset({ name: "" });
    }
  }, [player, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditPlayerFormData) => {
      if (!player) throw new Error('No player selected');
      const response = await fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, ...data }),
      });
      if (!response.ok) {
        throw new Error('Failed to update player');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      onClose();
      form.reset();
      toast({ 
        title: "Player updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update player",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditPlayerFormData) => {
    updateMutation.mutate(data);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              {...form.register("name")}
              className={form.formState.errors.name ? "border-red-500" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                form.reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}