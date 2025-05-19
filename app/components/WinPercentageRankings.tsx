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
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    // For now, using mock data for visualization
    setRankings(mockRankings);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10">Loading rankings...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {rankings.map((player, index) => (
        <div key={player.id} className="border rounded-lg p-4 relative">
          <div className="absolute top-2 left-2 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-700">
            {index + 1}
          </div>
          <div className="ml-8">
            <h3 className="font-semibold text-gray-800">{player.name}</h3>
            <p className="text-xs text-gray-500">{player.games} games played</p>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${getColorForPercentage(player.winPercentage)}`} 
              style={{ width: getBarWidth(player.winPercentage) }}
            ></div>
          </div>
          <div className="text-right text-sm font-medium mt-1 text-gray-700">{player.winPercentage.toFixed(1)}%</div>
        </div>
      ))}
    </div>
  );
}