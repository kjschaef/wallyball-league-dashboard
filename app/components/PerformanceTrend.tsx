'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = [
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

interface PerformanceTrendProps {
  isExporting?: boolean;
}

export function PerformanceTrend({ isExporting: _isExporting = false }: PerformanceTrendProps) {
  const [metric, setMetric] = useState<'winPercentage' | 'totalWins'>('winPercentage');
  const [showAllData, setShowAllData] = useState(false);
  const [players, setPlayers] = useState<Array<{id: number; name: string; matches: Array<{date: string; won: boolean}>}>>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{date: string; [key: string]: unknown}>>([]);

  // Fetch players data
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) {
          throw new Error('Failed to fetch player data');
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching player data:', error);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Process data when players or metric changes
  useEffect(() => {
    if (!players.length) return;
    
    // Process player data to calculate performance metrics
    const playerStats = players.map((player) => {
      const dailyStats = new Map();
      let cumulativeWins = 0;
      let cumulativeTotalGames = 0;
      const daysPlayed = new Set();
      
      // Sort matches by date
      const sortedMatches = [...(player.matches || [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sortedMatches.forEach((match) => {
        const date = format(new Date(match.date), "yyyy-MM-dd");
        const won = match.won || false;
        
        cumulativeWins += won ? 1 : 0;
        cumulativeTotalGames += 1;
        daysPlayed.add(date);
        
        // Calculate win percentage
        const winPercentage = cumulativeTotalGames > 0 
          ? (cumulativeWins / cumulativeTotalGames) * 100 
          : 0;
          
        dailyStats.set(date, { 
          winPercentage: winPercentage,
          totalWins: cumulativeWins 
        });
      });

      return {
        id: player.id,
        name: player.name,
        dailyStats,
      };
    });

    // Get all unique dates
    const allDates = new Set<string>();
    playerStats.forEach((player) => {
      player.dailyStats.forEach((_, date) => allDates.add(date));
    });

    // Generate chart data with contiguous lines
    const sortedDates = Array.from(allDates).sort();
    const dateRange = showAllData ? sortedDates : sortedDates.slice(-4);
    
    // Create contiguous data by filling in missing values
    const newChartData = dateRange.map(date => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataPoint: any = { date };
      
      playerStats.forEach(player => {
        const stats = player.dailyStats.get(date);
        if (stats) {
          dataPoint[player.name] = stats[metric];
        } else {
          // Find the last known value for this player before this date
          const previousDates = sortedDates.filter(d => d < date);
          let lastKnownValue = null;
          
          for (let i = previousDates.length - 1; i >= 0; i--) {
            const prevStats = player.dailyStats.get(previousDates[i]);
            if (prevStats) {
              lastKnownValue = prevStats[metric];
              break;
            }
          }
          
          // Use last known value to create contiguous line
          if (lastKnownValue !== null) {
            dataPoint[player.name] = lastKnownValue;
          }
        }
      });
      
      return dataPoint;
    });

    setChartData(newChartData);
  }, [players, metric, showAllData]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-[300px] flex items-center justify-center">
          Loading player data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button 
            className={`${metric === 'winPercentage' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
            onClick={() => setMetric('winPercentage')}
          >
            Win %
          </button>
          <button 
            className={`${metric === 'totalWins' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
            onClick={() => setMetric('totalWins')}
          >
            Total Wins
          </button>
        </div>
        <div className="flex space-x-2">
          <button 
            className={`${!showAllData ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
            onClick={() => setShowAllData(false)}
          >
            Recent
          </button>
          <button 
            className={`${showAllData ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
            onClick={() => setShowAllData(true)}
          >
            All Data
          </button>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                try {
                  return format(parseISO(date), "MMM d");
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_e) {
                  return date;
                }
              }}
            />
            <YAxis
              domain={metric === 'winPercentage' ? [0, 100] : [0, 'auto']}
              tickFormatter={(value) => metric === 'winPercentage' ? `${Math.round(value)}%` : `${Math.round(value)}`}
            />
            <Tooltip
              labelFormatter={(date) => {
                try {
                  return format(parseISO(date as string), "MMM d, yyyy");
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_e) {
                  return date;
                }
              }}
              formatter={(value: number, name: string) => {
                const formattedValue = Number(value.toFixed(1));
                return [
                  metric === 'winPercentage' ? `${formattedValue}%` : formattedValue,
                  name
                ];
              }}
              itemSorter={(item) => {
                // Sort by value in descending order (highest win% at top)
                return -Number(item.value);
              }}
            />
            <Legend />
            {players.map((player, index) => (
              <Line
                key={player.id}
                type="monotone"
                dataKey={player.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={false}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}