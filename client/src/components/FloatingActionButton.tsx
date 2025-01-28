
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FloatingActionButtonProps {
  onAddPlayer: () => void;
  onRecordGame: () => void;
}

export function FloatingActionButton({
  onAddPlayer,
  onRecordGame,
}: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-6 right-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="h-14 w-14 rounded-full">
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Add Player</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Player</DialogTitle>
              </DialogHeader>
              {/* Add Player form content will go here */}
            </DialogContent>
          </Dialog>
          <DropdownMenuItem onClick={onRecordGame}>
            Record Match
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
