'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export interface GameScore {
  gameNumber: number;
  teamOneScore: number;
  teamTwoScore: number;
}

export interface MatchHistoryItem {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
  gameScores?: GameScore[];
}

interface GameHistoryProps {
  games: MatchHistoryItem[];
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
  const getWinningTeam = (game: MatchHistoryItem) => {
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
          const hasGameScores = game.gameScores && game.gameScores.length > 0;
          
          return (
            <div
              key={game.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              {/* Game Summary Row */}
              <button
                className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                onClick={() => toggleGameExpansion(game.id)}
                aria-expanded={expandedGameId === game.id}
                title="View match details"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {formatDate(game.date)}
                  </span>
                  
                  <div className="flex items-center">
                    <span className={`font-semibold ${winningTeam === 'teamOne' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamOnePlayers.join(' & ')}
                    </span>
                    
                    <span className="mx-2 font-bold text-gray-400">vs</span>
                    
                    <span className={`font-semibold ${winningTeam === 'teamTwo' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamTwoPlayers.join(' & ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {hasGameScores && (
                    <span className="hidden md:inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {game.gameScores!.map(gs => `${gs.teamOneScore}-${gs.teamTwoScore}`).join(', ')}
                    </span>
                  )}

                  <div className="flex items-center">
                    <span className={`text-xl font-bold ${winningTeam === 'teamOne' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamOneGamesWon}
                    </span>
                    <span className="mx-1 text-xl text-gray-400">-</span>
                    <span className={`text-xl font-bold ${winningTeam === 'teamTwo' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamTwoGamesWon}
                    </span>
                  </div>
                  
                  <span
                    className={`p-1 text-gray-400 transition-transform duration-200 ${expandedGameId === game.id ? 'rotate-90 text-gray-700' : ''}`}
                    aria-hidden="true"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </div>
              </button>
              
              {/* Expanded Game Details */}
              {expandedGameId === game.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Team 1</h5>
                      <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                        {game.teamOnePlayers.map((player, idx) => (
                          <li key={idx}>{player}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Team 2</h5>
                      <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                        {game.teamTwoPlayers.map((player, idx) => (
                          <li key={idx}>{player}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {hasGameScores ? (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Individual Game Scores</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                              <th className="pb-2 font-medium">Game</th>
                              <th className="pb-2 font-medium text-center">Team 1</th>
                              <th className="pb-2 font-medium text-center">Team 2</th>
                              <th className="pb-2 font-medium text-right">Outcome</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {game.gameScores!.map((gs) => {
                              const t1Wins = gs.teamOneScore > gs.teamTwoScore;
                              return (
                                <tr key={gs.gameNumber}>
                                  <td className="py-2 font-medium text-gray-700">Game {gs.gameNumber}</td>
                                  <td className={`py-2 text-center font-semibold ${t1Wins ? 'text-green-600' : 'text-gray-600'}`}>
                                    {gs.teamOneScore}
                                  </td>
                                  <td className={`py-2 text-center font-semibold ${!t1Wins ? 'text-green-600' : 'text-gray-600'}`}>
                                    {gs.teamTwoScore}
                                  </td>
                                  <td className="py-2 text-right">
                                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                                      t1Wins ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {t1Wins ? 'Team 1 Win' : 'Team 2 Win'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Match Result</h5>
                      <p className="text-sm font-medium">
                        <span className={winningTeam === 'teamOne' ? 'text-green-600 font-bold' : 'text-gray-700'}>
                          Team 1: {game.teamOneGamesWon}
                        </span>
                        {' — '}
                        <span className={winningTeam === 'teamTwo' ? 'text-green-600 font-bold' : 'text-gray-700'}>
                          Team 2: {game.teamTwoGamesWon}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}