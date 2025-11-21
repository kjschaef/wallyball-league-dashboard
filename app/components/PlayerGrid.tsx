'use client';

interface Player {
  id: number;
  name: string;
  winPercentage?: number;
  record?: {
    wins: number;
    losses: number;
  };
  streak?: {
    type: string;
    count: number;
  };
  inactivityPenalty?: number;
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

          const getStreakColor = (streak?: { type: string; count: number }) => {
            if (!streak) return 'text-gray-500';
            // Activity streaks are always positive (green)
            return streak.count >= 3 ? 'text-green-600' : 'text-green-500';
          };

          return (
            <div
              key={player.id}
              onClick={() => canSelect && handlePlayerClick(player.id)}
              onKeyDown={(e) => canSelect && (e.key === 'Enter' || e.key === ' ') && handlePlayerClick(player.id)}
              tabIndex={canSelect ? 0 : -1}
              role="button"
              aria-pressed={isSelected}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${isSelected
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

              {(player.record || player.streak) && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {player.record && (
                    <span>{player.record.wins}W - {player.record.losses}L</span>
                  )}
                  {player.streak && (
                    <span className={getStreakColor(player.streak)}>
                      {player.streak.count} weeks
                    </span>
                  )}
                </div>
              )}

              {player.inactivityPenalty && player.inactivityPenalty > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  -{player.inactivityPenalty}% inactivity
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}