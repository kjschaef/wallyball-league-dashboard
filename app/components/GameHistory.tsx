'use client';

import { useState } from 'react';

interface GameHistoryProps {
  games: Array<{
    id: number;
    date: string;
    teamOnePlayers: string[];
    teamTwoPlayers: string[];
    teamOneGamesWon: number;
    teamTwoGamesWon: number;
  }>;
}

export function GameHistory({ games }: GameHistoryProps) {
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  const toggleGameExpansion = (gameId: number) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  // Determine the winning team
  const getWinningTeam = (game: GameHistoryProps['games'][0]) => {
    if (game.teamOneGamesWon > game.teamTwoGamesWon) {
      return 'teamOne';
    } else if (game.teamTwoGamesWon > game.teamOneGamesWon) {
      return 'teamTwo';
    }
    return 'tie';
  };

  return (
    <div className="space-y-4">
      {games.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No match results found with the current filters.
        </div>
      ) : (
        games.map((game) => {
          const winningTeam = getWinningTeam(game);
          
          return (
            <div
              key={game.id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              {/* Game Summary Row */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleGameExpansion(game.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {formatDate(game.date)}
                  </span>
                  
                  <div className="flex items-center">
                    <span className={`font-semibold ${winningTeam === 'teamOne' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamOnePlayers.join(' & ')}
                    </span>
                    
                    <span className="mx-2 font-bold">vs</span>
                    
                    <span className={`font-semibold ${winningTeam === 'teamTwo' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamTwoPlayers.join(' & ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`text-xl font-bold ${winningTeam === 'teamOne' ? 'text-green-600' : 'text-gray-700'}`}>
                    {game.teamOneGamesWon}
                  </span>
                  <span className="mx-1 text-xl">-</span>
                  <span className={`text-xl font-bold ${winningTeam === 'teamTwo' ? 'text-green-600' : 'text-gray-700'}`}>
                    {game.teamTwoGamesWon}
                  </span>
                  
                  <button
                    className="ml-4 p-1"
                    aria-label={expandedGameId === game.id ? 'Collapse details' : 'Expand details'}
                  >
                    {expandedGameId === game.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>
              
              {/* Expanded Game Details */}
              {expandedGameId === game.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <h4 className="font-semibold mb-2">Game Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Team 1</h5>
                      <ul className="list-disc pl-5">
                        {game.teamOnePlayers.map((player, idx) => (
                          <li key={idx}>{player}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Team 2</h5>
                      <ul className="list-disc pl-5">
                        {game.teamTwoPlayers.map((player, idx) => (
                          <li key={idx}>{player}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-500 mb-1">Match Result</h5>
                    <p>
                      <span className={`font-medium ${winningTeam === 'teamOne' ? 'text-green-600' : 'text-gray-700'}`}>
                        Team 1: {game.teamOneGamesWon}
                      </span>
                      {' - '}
                      <span className={`font-medium ${winningTeam === 'teamTwo' ? 'text-green-600' : 'text-gray-700'}`}>
                        Team 2: {game.teamTwoGamesWon}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}