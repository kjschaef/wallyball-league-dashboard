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

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlayerDialog({ open, onOpenChange }: AddPlayerDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      onOpenChange(false);
      if (formRef.current) {
        formRef.current.reset();
      }
      toast({ title: "Player created successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the new player's information below.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
              onClick={() => onOpenChange(false)}
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
  );
}
