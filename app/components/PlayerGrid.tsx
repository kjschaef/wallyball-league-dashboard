'use client';

interface Player {
  id: number;
  name: string;
  winPercentage?: number;
  record?: {
    wins: number;
    losses: number;
  };

}

interface PlayerGridProps {
  players: Player[];
  selectedPlayers: number[];
  onPlayerToggle: (playerId: number) => void;
  maxPlayers?: number;
  title: string;
  multiSelect?: boolean;
}

export function PlayerGrid({
  players,
  selectedPlayers,
  onPlayerToggle,
  maxPlayers,
  title,
  multiSelect = true
}: PlayerGridProps) {
  const handlePlayerClick = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      onPlayerToggle(playerId);
    } else if (!maxPlayers || selectedPlayers.length < maxPlayers || !multiSelect) {
      onPlayerToggle(playerId);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {maxPlayers && (
          <p className="text-sm text-gray-600">
            {multiSelect ? `Select up to ${maxPlayers} players` : `Select players`}
            {selectedPlayers.length > 0 && ` (${selectedPlayers.length} selected)`}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {players.map((player) => {
          const isSelected = selectedPlayers.includes(player.id);
          const canSelect = !maxPlayers || selectedPlayers.length < maxPlayers || isSelected || !multiSelect;

          const getWinPercentageColor = (percentage?: number) => {
            if (!percentage) return 'text-gray-500';
            if (percentage >= 50) return 'text-green-600';
            if (percentage >= 40) return 'text-yellow-600';
            return 'text-red-600';
          };



          return (
            <button
              type="button"
              key={player.id}
              onClick={() => canSelect && handlePlayerClick(player.id)}
              aria-pressed={isSelected}
              disabled={!canSelect}
              className={`w-full text-left p-3 border rounded-lg cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isSelected
                ? 'border-blue-500 bg-blue-50'
                : canSelect
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{player.name}</h3>
                {player.winPercentage && (
                  <div className={`text-sm font-medium ${getWinPercentageColor(player.winPercentage)}`}>
                    {player.winPercentage}%
                  </div>
                )}
              </div>

              {(player.record) && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {player.record && (
                    <span>{player.record.wins}W - {player.record.losses}L</span>
                  )}
                </div>
              )}


            </button>
          );
        })}
      </div>
    </div>
  );
}