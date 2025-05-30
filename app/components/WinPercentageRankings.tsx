'use client';

import { useEffect, useState } from 'react';
import { calculatePenalizedWinPercentage } from '../lib/utils';

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

// Define color for the ranking bars based on win percentage
const getColorForPercentage = (percentage: number) => {
  if (percentage >= 55) return 'bg-green-500';
  if (percentage >= 50) return 'bg-blue-500'; 
  if (percentage >= 45) return 'bg-yellow-500';
  if (percentage >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

// Get width for the progress bar
const getBarWidth = (percentage: number) => {
  return `${Math.max(percentage, 5)}%`;
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

  useEffect(() => {
    // Fetch real rankings data from the original site
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) {
          throw new Error('Failed to fetch player rankings');
        }
        
        const players = await response.json();
        
        // Sort players by penalized win percentage (highest first)
        const sortedPlayers = [...players].sort((a, b) => {
          // Calculate win percentages with inactivity penalty applied
          const { penalizedWinRate: aWinRate } = calculatePenalizedWinPercentage(a);
          const { penalizedWinRate: bWinRate } = calculatePenalizedWinPercentage(b);
          
          // Sort by penalized win percentage (highest first)
          return bWinRate - aWinRate;
        });
        
        // Format for our rankings component
        const formattedRankings = sortedPlayers.map(player => {
          const total = player.stats.won + player.stats.lost;
          const penaltyData = calculatePenalizedWinPercentage(player);
          const penalizedWinRate = typeof penaltyData === 'number' ? penaltyData : penaltyData.penalizedWinRate;
          const penaltyPercentage = typeof penaltyData === 'number' ? 0 : penaltyData.penaltyPercentage;
          
          return {
            id: player.id,
            name: player.name,
            games: total,
            winPercentage: penalizedWinRate,
            hasInactivityPenalty: penaltyPercentage > 0,
            penaltyPercentage: Math.round(penaltyPercentage * 100)
          };
        });
        
        setRankings(formattedRankings.map(ranking => ({
          id: ranking.id,
          name: ranking.name,
          winPercentage: ranking.winPercentage,
          matches: ranking.games,
          hasInactivityPenalty: ranking.hasInactivityPenalty,
          penaltyPercentage: ranking.penaltyPercentage
        })));
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setRankings(mockRankings.map(ranking => ({
          ...ranking,
          matches: ranking.games
        })));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankings();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10">Loading rankings...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {rankings.map((player, index) => (
        <div key={player.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-700">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{player.name}</h3>
                <p className="text-xs text-gray-500">{player.matches} games played</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {player.winPercentage.toFixed(1)}%
              </div>
              {player.hasInactivityPenalty && (
                <div className="text-xs text-orange-600 font-medium">
                  -{player.penaltyPercentage}% inactive
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}