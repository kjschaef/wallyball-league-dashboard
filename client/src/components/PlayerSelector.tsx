interface PlayerSelectorProps {
  players: Player[];
  selectedPlayers: number[];
  maxPlayers?: number;
  excludedPlayers?: number[];
  onSelect: (playerId: number) => void;
  className?: string;
}

export function PlayerSelector({
  players,
  selectedPlayers,
  maxPlayers = 3,
  excludedPlayers = [],
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
            const isExcluded = excludedPlayers.includes(player.id);
            return (
              <Button
                key={player.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-auto min-h-[4rem] w-full flex-col items-center justify-center gap-2 p-4",
                  (!canSelectMore && !isSelected) || isExcluded ? "opacity-50 cursor-not-allowed" : ""
                )}
                disabled={isExcluded}
                onClick={() => {
                  if ((isSelected || canSelectMore) && !isExcluded) {
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
                {isExcluded && (
                  <span className="text-xs text-red-500">
                    On other team
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