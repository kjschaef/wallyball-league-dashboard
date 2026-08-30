'use client';

import { useEffect, useState } from 'react';
import { getPlayerThreshold } from '../lib/playerFiltering';

interface WinPercentageRankingsProps {
  season?: string;
  showAllPlayers?: boolean;
}

// Mock data for the rankings as shown in the screenshot
const mockRankings = [
  { id: 16, name: 'Troy', games: 3, winPercentage: 57.1 },
  { id: 2, name: 'Nate', games: 117, winPercentage: 55.9 },
  { id: 1, name: 'Lance', games: 72, winPercentage: 55.1 },
  { id: 3, name: 'Shortt', games: 127, winPercentage: 54.0 },
  { id: 6, name: 'Relly', games: 27, winPercentage: 49.8 },
  { id: 4, name: 'Vamsi', games: 62, winPercentage: 42.2 },
  { id: 5, name: 'Keith', games: 43, winPercentage: 41.0 },
  { id: 8, name: 'Zach', games: 31, winPercentage: 39.4 },
  { id: 10, name: 'Ambree', games: 8, winPercentage: 39.1 }
];

// Chart colors to match the line chart
const CHART_COLORS = [
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Turquoise
  "#FFD93D", // Sun Yellow
  "#6C5CE7", // Deep Purple
  "#A8E6CF", // Mint Green
  "#FF8B94", // Light Pink
  "#45B7D1", // Sky Blue
  "#98CE00", // Lime Green
  "#FF71CE", // Hot Pink
  "#01CDFE", // Electric Blue
  "#05FFA1", // Neon Green
  "#B967FF", // Bright Purple
];

// Get player color based on their name (consistent with chart)
const getPlayerColor = (playerName: string, allPlayers: string[]) => {
  // Find the index of this player in the original players array (same order as chart)
  const originalIndex = allPlayers.indexOf(playerName);
  return originalIndex >= 0 ? CHART_COLORS[originalIndex % CHART_COLORS.length] : CHART_COLORS[0];
};

export function WinPercentageRankings({ season, showAllPlayers = false }: WinPercentageRankingsProps = {}) {
  const [rankingMetric, setRankingMetric] = useState<'winPercentage' | 'elo'>('winPercentage');
  const [allStats, setAllStats] = useState<Array<{
    id: number;
    name: string;
    winPercentage: number;
    matches: number;
    elo: number;
    isProvisional: boolean;
    careerGames: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [recentMatchPlayers, setRecentMatchPlayers] = useState<string[]>([]);
  const [originalPlayerOrder, setOriginalPlayerOrder] = useState<string[]>([]);

  useEffect(() => {
    // Fetch player stats and recent matches
    const fetchData = async () => {
      try {
        // Fetch player stats (already calculated with game-level data and Elo)
        const seasonParam = season ? `season=${season}` : '';
        const [statsResponse, matchesResponse] = await Promise.all([
          fetch(`/api/player-stats${seasonParam ? `?${seasonParam}` : ''}`),
          fetch('/api/matches?limit=10')
        ]);

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch player stats');
        }

        const playerStats = await statsResponse.json();

        // Store original player order for consistent color assignment
        setOriginalPlayerOrder(playerStats.map((p: any) => p.name));

        // Fetch recent matches for highlighting
        let recentPlayers: string[] = [];

        if (matchesResponse.ok) {
          const matches = await matchesResponse.json();
          // Get the most recent day's matches
          if (matches.length > 0) {
            const sortedMatches = [...matches].sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const mostRecentDate = new Date(sortedMatches[0].date).toDateString();
            const lastDayMatches = sortedMatches.filter(match =>
              new Date(match.date).toDateString() === mostRecentDate
            );

            // Extract all player names from recent matches
            recentPlayers = lastDayMatches.reduce((acc, match) => {
              return [...acc, ...match.teamOnePlayers, ...match.teamTwoPlayers];
            }, [] as string[]);
            recentPlayers = Array.from(new Set(recentPlayers)); // Remove duplicates
          }
        }

        setRecentMatchPlayers(recentPlayers);

        const mappedStats = playerStats.map((player: any) => ({
          id: player.id,
          name: player.name,
          winPercentage: player.winPercentage ?? 0,
          matches: player.record?.totalGames ?? 0,
          elo: player.elo ?? 1500,
          isProvisional: player.isProvisional ?? true,
          careerGames: player.careerGames ?? player.record?.totalGames ?? 0,
        }));

        setAllStats(mappedStats);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAllStats(mockRankings.map(ranking => ({
          id: ranking.id,
          name: ranking.name,
          winPercentage: ranking.winPercentage,
          matches: ranking.games,
          elo: 1500,
          isProvisional: true,
          careerGames: ranking.games,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [season, showAllPlayers]);

  if (loading) {
    return <div className="flex justify-center py-10">Loading rankings...</div>;
  }

  // Filter and sort based on selected ranking metric
  const threshold = getPlayerThreshold(allStats.map(s => ({ ...s, record: { totalGames: s.matches } })), showAllPlayers);
  
  const displayedRankings = [...allStats]
    .filter(p => rankingMetric === 'elo' || p.matches >= threshold)
    .sort((a, b) => {
      if (rankingMetric === 'elo') {
        return b.elo - a.elo;
      }
      return b.winPercentage - a.winPercentage;
    });

  return (
    <div className="space-y-3">
      {/* Metric Toggle */}
      <div className="flex items-center justify-between">
        <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setRankingMetric('winPercentage')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              rankingMetric === 'winPercentage'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Win % {season && season !== 'lifetime' ? `(${season === 'current' ? 'Season' : season})` : '(Lifetime)'}
          </button>
          <button
            type="button"
            onClick={() => setRankingMetric('elo')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              rankingMetric === 'elo'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Power Ranking
          </button>
        </div>
      </div>

      {/* Rankings Grid */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {displayedRankings.map((player, index) => {
          const isInRecentMatch = recentMatchPlayers.includes(player.name);
          const playerColor = getPlayerColor(player.name, originalPlayerOrder);
          const borderStyle = isInRecentMatch
            ? { borderColor: playerColor, borderWidth: '2px' }
            : {};

          const isProvisionalRank = rankingMetric === 'elo'
            ? player.isProvisional
            : player.matches < 50;

          return (
            <div
              key={player.id}
              className={`${isProvisionalRank ? 'bg-gray-100 opacity-90' : 'bg-white'} border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow w-full sm:w-[200px] flex-grow flex-shrink-0`}
              style={borderStyle}
              title={
                rankingMetric === 'elo'
                  ? (player.isProvisional ? 'Provisional rating (less than 25 career games played)' : undefined)
                  : (player.matches < 50 ? 'Provisional ranking (less than 50 games played)' : undefined)
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span
                        className="font-medium text-xs truncate"
                        style={{ color: playerColor }}
                      >
                        {player.name}
                      </span>
                      {rankingMetric === 'elo' && player.isProvisional && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-semibold flex-shrink-0">
                          PROV
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {rankingMetric === 'elo'
                        ? `${player.careerGames} career games`
                        : `${player.matches} games`}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {rankingMetric === 'elo' ? (
                    <div className="text-sm font-bold text-indigo-700">
                      {player.elo} <span className="text-[10px] font-normal text-gray-500">Power Ranking</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-gray-900">
                      {player.winPercentage.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
