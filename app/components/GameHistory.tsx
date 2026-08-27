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
  eloDetails?: {
    teamOnePreAvg: number;
    teamTwoPreAvg: number;
    teamOneDelta: number;
    teamTwoDelta: number;
    isUpset: boolean;
    expectedT1WinRate: number;
    hasScoredGames?: boolean;
    averageMarginMultiplier?: number;
    gameBreakdowns?: Array<{
      gameNumber: number;
      isScored: boolean;
      teamOneScore?: number;
      teamTwoScore?: number;
      margin: number;
      multiplier: number;
      t1Won: boolean;
    }>;
  } | null;
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
    <div className="space-y-3">
      {games.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No match results found with the current filters.
        </div>
      ) : (
        games.map((game) => {
          const winningTeam = getWinningTeam(game);
          const hasGameScores = (game.gameScores && game.gameScores.length > 0) || !!game.eloDetails?.hasScoredGames;
          const elo = game.eloDetails;
          const winningDelta = elo ? (winningTeam === 'teamOne' ? elo.teamOneDelta : elo.teamTwoDelta) : null;
          
          return (
            <div
              key={game.id}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-gray-300"
            >
              {/* Game Summary Row */}
              <button
                className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                onClick={() => toggleGameExpansion(game.id)}
                aria-expanded={expandedGameId === game.id}
                title="View match details"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatDate(game.date)}
                  </span>
                  
                  <div className="flex items-center flex-wrap gap-1">
                    <span className={`font-bold text-sm ${winningTeam === 'teamOne' ? 'text-green-600' : 'text-gray-800'}`}>
                      {game.teamOnePlayers.join(' & ')}
                    </span>
                    {elo && (
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({elo.teamOnePreAvg})
                      </span>
                    )}
                    
                    <span className="mx-1 font-bold text-gray-300 text-xs">vs</span>
                    
                    <span className={`font-bold text-sm ${winningTeam === 'teamTwo' ? 'text-green-600' : 'text-gray-800'}`}>
                      {game.teamTwoPlayers.join(' & ')}
                    </span>
                    {elo && (
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({elo.teamTwoPreAvg})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5">
                  {elo?.isUpset && (
                    <span
                      title="Upset victory: The underdog team with a lower pre-match average Power Ranking won this match!"
                      className="hidden sm:inline-flex items-center text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 cursor-help"
                    >
                      🔥 UPSET
                    </span>
                  )}

                  {winningDelta !== null && (
                    <span
                      title={`Match Rating Impact: Winner gained ${winningDelta > 0 ? `+${winningDelta}` : winningDelta} Power Ranking based on pre-match team averages (${elo?.teamOnePreAvg} vs ${elo?.teamTwoPreAvg})`}
                      className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/90 px-2.5 py-0.5 rounded-md cursor-help"
                    >
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase">Winner:</span>
                      {winningDelta > 0 ? `+${winningDelta}` : winningDelta} Power Ranking
                    </span>
                  )}

                  {hasGameScores && game.gameScores && game.gameScores.length > 0 && (
                    <span className="hidden lg:inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {game.gameScores.map(gs => `${gs.teamOneScore}-${gs.teamTwoScore}`).join(', ')}
                    </span>
                  )}

                  <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    <span className={`text-base font-bold ${winningTeam === 'teamOne' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamOneGamesWon}
                    </span>
                    <span className="mx-1 text-sm text-gray-400">-</span>
                    <span className={`text-base font-bold ${winningTeam === 'teamTwo' ? 'text-green-600' : 'text-gray-700'}`}>
                      {game.teamTwoGamesWon}
                    </span>
                  </div>
                  
                  <span
                    className={`p-1 text-gray-400 transition-transform duration-200 ${expandedGameId === game.id ? 'rotate-90 text-gray-700' : ''}`}
                    aria-hidden="true"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
              
              {/* Expanded Game Details */}
              {expandedGameId === game.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-4 bg-gray-50">
                  {/* Rating Impact Breakdown */}
                  {elo && (() => {
                    const t1Odds = elo.expectedT1WinRate <= 1
                      ? Math.round(elo.expectedT1WinRate * 100)
                      : Math.round(elo.expectedT1WinRate);
                    const t2Odds = Math.max(0, Math.min(100, 100 - t1Odds));
                    const isScored = hasGameScores && (elo.hasScoredGames ?? true);
                    const avgMultiplier = elo.averageMarginMultiplier ?? (isScored ? 1.4 : 1.0);

                    return (
                      <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>⚡ Power Ranking Calculation Breakdown</span>
                            {elo.isUpset && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.2 rounded-full border border-rose-200">
                                🔥 UPSET
                              </span>
                            )}
                          </h5>
                          
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isScored ? (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                📊 Scored Match ({avgMultiplier}x Margin Multiplier)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full border border-gray-300">
                                📝 Unscored Match (1.0x Baseline)
                              </span>
                            )}
                            <span className="text-[11px] text-indigo-700 font-medium">
                              Win Odds: Team 1 ({t1Odds}%) • Team 2 ({t2Odds}%)
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2.5 rounded-lg border border-indigo-100/80 flex items-center justify-between">
                            <span className="font-semibold text-gray-700">Team 1 ({elo.teamOnePreAvg} Avg)</span>
                            <span className={`font-bold ${elo.teamOneDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {elo.teamOneDelta > 0 ? `+${elo.teamOneDelta}` : elo.teamOneDelta} Power Ranking
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-indigo-100/80 flex items-center justify-between">
                            <span className="font-semibold text-gray-700">Team 2 ({elo.teamTwoPreAvg} Avg)</span>
                            <span className={`font-bold ${elo.teamTwoDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {elo.teamTwoDelta > 0 ? `+${elo.teamTwoDelta}` : elo.teamTwoDelta} Power Ranking
                            </span>
                          </div>
                        </div>

                        {/* Plain-English Explanation */}
                        <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-indigo-950 leading-relaxed space-y-1">
                          <p>
                            <strong>Why this change occurred:</strong>{' '}
                            {winningTeam === 'teamOne' ? (
                              <>
                                Team 1 ({t1Odds}% expected win chance) defeated Team 2.{' '}
                                {isScored
                                  ? `Because exact scores were recorded with an average ${avgMultiplier}x Margin of Victory multiplier, the winning team gained +${elo.teamOneDelta} Power Ranking.`
                                  : `Because this match was entered without point scores, it used the baseline 1.0x multiplier (+${elo.teamOneDelta} Power Ranking). Scored matches with point margins move rankings up to 2.0x faster.`}
                              </>
                            ) : winningTeam === 'teamTwo' ? (
                              <>
                                Team 2 ({t2Odds}% expected win chance) defeated Team 1.{' '}
                                {isScored
                                  ? `Because exact scores were recorded with an average ${avgMultiplier}x Margin of Victory multiplier, the winning team gained +${elo.teamTwoDelta} Power Ranking.`
                                  : `Because this match was entered without point scores, it used the baseline 1.0x multiplier (+${elo.teamTwoDelta} Power Ranking). Scored matches with point margins move rankings up to 2.0x faster.`}
                              </>
                            ) : (
                              'Teams tied in games won.'
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

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
                  
                  {hasGameScores && game.gameScores && game.gameScores.length > 0 ? (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Individual Game Scores & Multipliers
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                              <th className="pb-2 font-medium">Game</th>
                              <th className="pb-2 font-medium text-center">Team 1</th>
                              <th className="pb-2 font-medium text-center">Team 2</th>
                              <th className="pb-2 font-medium text-center">Point Margin</th>
                              <th className="pb-2 font-medium text-right">Outcome & Multiplier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {game.gameScores.map((gs) => {
                              const t1Wins = gs.teamOneScore > gs.teamTwoScore;
                              const margin = Math.abs(gs.teamOneScore - gs.teamTwoScore);
                              const multiplier = margin <= 1 ? 1.0 : Math.min(2.0, 1.0 + Math.log(margin) * 0.35);

                              return (
                                <tr key={gs.gameNumber}>
                                  <td className="py-2 font-medium text-gray-700">Game {gs.gameNumber}</td>
                                  <td className={`py-2 text-center font-semibold ${t1Wins ? 'text-green-600' : 'text-gray-600'}`}>
                                    {gs.teamOneScore}
                                  </td>
                                  <td className={`py-2 text-center font-semibold ${!t1Wins ? 'text-green-600' : 'text-gray-600'}`}>
                                    {gs.teamTwoScore}
                                  </td>
                                  <td className="py-2 text-center text-xs text-gray-500 font-medium">
                                    +{margin} {margin === 1 ? 'pt' : 'pts'}
                                  </td>
                                  <td className="py-2 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                                        t1Wins ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {t1Wins ? 'Team 1 Win' : 'Team 2 Win'}
                                      </span>
                                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                        {multiplier.toFixed(2)}x
                                      </span>
                                    </div>
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