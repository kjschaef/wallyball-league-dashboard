'use client';

import { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// Define interfaces for the player data
interface ExtendedPlayer {
  id: number;
  name: string;
  matches: Array<{ won: boolean; date: string }>;
  stats: { won: number; lost: number; totalGames: number; totalMatchTime: number };
  [key: string]: unknown;
}

// Define metrics for radar chart
interface PerformanceMetric {
  name: string;
  displayName: string;
  description: string;
  calculate: (player: ExtendedPlayer, allPlayers: ExtendedPlayer[]) => number;
  scale: [number, number]; // [min, max]
}

// Mock player data for demonstration
const mockPlayers: ExtendedPlayer[] = [
  {
    id: 1,
    name: 'Troy',
    matches: Array(20).fill(null).map((_, i) => ({
      won: Math.random() > 0.3, // 70% win rate
      date: new Date(2023, 0, i + 1).toISOString()
    })),
    stats: { won: 14, lost: 6, totalGames: 45, totalMatchTime: 540 }
  },
  {
    id: 2,
    name: 'Nate',
    matches: Array(117).fill(null).map((_, i) => ({
      won: Math.random() > 0.44, // 56% win rate
      date: new Date(2023, 0, i % 30 + 1).toISOString()
    })),
    stats: { won: 65, lost: 52, totalGames: 280, totalMatchTime: 3200 }
  }
];

// Performance metrics definitions
const performanceMetrics: PerformanceMetric[] = [
  {
    name: 'winRate',
    displayName: 'Win Rate',
    description: 'Percentage of matches won',
    calculate: (player) => {
      const total = player.stats.won + player.stats.lost;
      return total > 0 ? (player.stats.won / total) * 100 : 0;
    },
    scale: [0, 100]
  },
  {
    name: 'consistency',
    displayName: 'Consistency',
    description: 'How consistent player performance is',
    calculate: (player) => {
      // Simplified: in real app would analyze streaks
      return player.matches.length > 10 ? 65 + Math.random() * 25 : 40 + Math.random() * 30;
    },
    scale: [0, 100]
  },
  {
    name: 'experience',
    displayName: 'Experience',
    description: 'Based on number of matches played',
    calculate: (player, allPlayers) => {
      const maxMatches = Math.max(...allPlayers.map(p => p.matches.length));
      return maxMatches > 0 ? (player.matches.length / maxMatches) * 100 : 0;
    },
    scale: [0, 100]
  },
  {
    name: 'versatility',
    displayName: 'Versatility',
    description: 'Ability to win with different partners',
    calculate: () => {
      // Simplified: in real app would analyze partner combinations
      return 40 + Math.random() * 60;
    },
    scale: [0, 100]
  },
  {
    name: 'clutch',
    displayName: 'Clutch Factor',
    description: 'Performance in close matches',
    calculate: () => {
      // Simplified: in real app would analyze close games
      return 40 + Math.random() * 60;
    },
    scale: [0, 100]
  }
];

export function PlayerPerformanceRadar() {
  const [player, setPlayer] = useState<ExtendedPlayer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [radarData, setRadarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch this data from the API
    // Here using mock data for visualization
    const selectedPlayer = mockPlayers[0]; // Using Troy for visualization
    setPlayer(selectedPlayer);
    
    if (selectedPlayer) {
      // Calculate radar metrics
      const metrics = performanceMetrics.map(metric => ({
        metric: metric.displayName,
        value: metric.calculate(selectedPlayer, mockPlayers),
        description: metric.description,
        fullMark: 100
      }));
      
      setRadarData(metrics);
    }
    
    setLoading(false);
  }, []);

  if (loading || !player) {
    return <div className="flex justify-center py-10">Loading radar data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name={player.name}
              dataKey="value"
              stroke="#4E4EFF"
              fill="#4E4EFF"
              fillOpacity={0.5}
            />
            <Tooltip formatter={(value) => [`${value}`, '']} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
        {radarData.map((item) => (
          <div 
            key={item.metric} 
            className="bg-gray-100 p-2 rounded"
            title={item.description}
          >
            <div className="font-semibold">{item.metric}</div>
            <div className="text-xl">{Math.round(item.value)}/100</div>
          </div>
        ))}
      </div>
    </div>
  );
}