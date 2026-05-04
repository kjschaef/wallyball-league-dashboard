'use client';

interface Player {
  id: number;
  name: string;
}

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
  maxPlayers = 2,
  onSelect,
  className = '',
}: PlayerSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {players.map((player) => {
          const isSelected = selectedPlayers.includes(player.id);
          const isDisabled = !isSelected && selectedPlayers.length >= maxPlayers;
          
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => onSelect(player.id)}
              disabled={isDisabled}
              className={`px-3 py-1 rounded text-sm ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {player.name}
            </button>
          );
        })}
      </div>
      
      {maxPlayers > 0 && (
        <p className="text-xs text-gray-500">
          Selected: {selectedPlayers.length}/{maxPlayers}
        </p>
      )}
    </div>
  );
}