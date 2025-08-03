
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2, Users } from "lucide-react";

interface Player {
  id: number;
  name: string;
}

interface PlayerSelectorDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allPlayers: Player[];
  selectedPlayers: number[];
  onTogglePlayer: (playerId: number) => void;
  onCancel: () => void;
  onGenerateTeams: () => void;
  isLoading: boolean;
}

export function PlayerSelectorDialog({
  isOpen,
  onOpenChange,
  allPlayers,
  selectedPlayers,
  onTogglePlayer,
  onCancel,
  onGenerateTeams,
  isLoading,
}: PlayerSelectorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Available Players
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            Select the players who are available today. The AI will create balanced teams from your selection.
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Available Players</h3>
              <p className="text-sm text-gray-600">
                Select players ({selectedPlayers.length} selected)
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {allPlayers.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => onTogglePlayer(player.id)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }
                    `}
                  >
                    {player.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Selected: {selectedPlayers.length} players
              {selectedPlayers.length >= 4 && (
                <span className="text-green-600 ml-2">✓ Ready for team suggestions</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={onGenerateTeams}
                disabled={selectedPlayers.length < 4 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Teams'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
