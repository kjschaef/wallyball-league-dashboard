'use client';

import { useEffect, useState } from 'react';

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

export function WinPercentageRankings() {
  const [rankings, setRankings] = useState<Array<{
    id: number; 
    name: string; 
    winPercentage: number; 
    matches: number;
    hasInactivityPenalty?: boolean;
    penaltyPercentage?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [recentMatchPlayers, setRecentMatchPlayers] = useState<string[]>([]);
  const [originalPlayerOrder, setOriginalPlayerOrder] = useState<string[]>([]);

  useEffect(() => {
    // Fetch player stats and recent matches
    const fetchData = async () => {
      try {
        // Fetch player stats (already calculated with game-level data)
        const [statsResponse, matchesResponse] = await Promise.all([
          fetch('/api/player-stats'),
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
        
        // Format the player stats data (already sorted by win percentage)
        const formattedRankings = playerStats.map((player: any) => {
          console.log('Player:', player.name, 'inactivityPenalty:', player.inactivityPenalty);
          return {
            id: player.id,
            name: player.name,
            winPercentage: player.winPercentage,
            matches: player.record.totalGames,
            hasInactivityPenalty: player.inactivityPenalty && player.inactivityPenalty > 0,
            penaltyPercentage: player.inactivityPenalty > 0 ? player.inactivityPenalty : undefined
          };
        });
        
        setRankings(formattedRankings);
      } catch (error) {
        console.error('Error fetching data:', error);
        setRankings(mockRankings.map(ranking => ({
          ...ranking,
          matches: ranking.games,
          hasInactivityPenalty: false,
          penaltyPercentage: 0
        })));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10">Loading rankings...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
      {rankings.slice(0, 16).map((player, index) => {
        const isInRecentMatch = recentMatchPlayers.includes(player.name);
        const playerColor = getPlayerColor(player.name, originalPlayerOrder);
        const borderStyle = isInRecentMatch 
          ? { borderColor: playerColor, borderWidth: '2px' }
          : {};
        
        return (
          <div 
            key={player.id} 
            className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-sm transition-shadow min-w-0"
            style={borderStyle}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div 
                    className="font-medium text-xs truncate" 
                    style={{ color: playerColor }}
                  >
                    {player.name}
                  </div>
                  <div className="text-xs text-gray-500">{player.matches} games</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-xs font-bold text-gray-900">
                  {player.winPercentage.toFixed(1)}%
                </div>
                {player.penaltyPercentage !== undefined && (
                  <div className="text-xs text-orange-600 font-medium">
                    -{player.penaltyPercentage}%
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}