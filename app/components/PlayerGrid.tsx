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
              key={player.id}
              type="button"
              onClick={() => handlePlayerClick(player.id)}
              disabled={!canSelect}
              aria-pressed={isSelected}
              className={`w-full text-left block p-3 border rounded-lg cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 disabled:border-gray-100 ${isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <span className="flex items-center justify-between mb-2">
                <span className="font-medium text-lg">{player.name}</span>
                {player.winPercentage && (
                  <span className={`text-sm font-medium ${getWinPercentageColor(player.winPercentage)}`}>
                    {player.winPercentage}%
                  </span>
                )}
              </span>

              {(player.record) && (
                <span className="flex items-center justify-between text-xs text-gray-500">
                  {player.record && (
                    <span>{player.record.wins}W - {player.record.losses}L</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}