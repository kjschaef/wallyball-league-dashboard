import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Player } from "@db/schema";

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayers: number[];
  maxPlayers?: number;
  onSelect: (playerId: number) => void;
  className?: string;
}

export function PlayerSelector({
  players,
  selectedPlayers,
  maxPlayers = 3,
  onSelect,
  className,
}: PlayerSelectorProps) {
  const canSelectMore = selectedPlayers.length < maxPlayers;

  return (
    <ScrollArea className={cn("h-[200px] rounded-md border", className)}>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {players?.map((player) => {
            const isSelected = selectedPlayers.includes(player.id);
            return (
              <Button
                key={player.id}
                type="button" // Prevent form submission
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-auto min-h-[4rem] w-full flex-col items-center justify-center gap-2 p-4",
                  !canSelectMore && !isSelected && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (isSelected || canSelectMore) {
                    onSelect(player.id);
                  }
                }}
              >
                <span className="text-lg font-semibold">{player.name}</span>
                {isSelected && (
                  <span className="text-xs">
                    Player {selectedPlayers.indexOf(player.id) + 1}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}