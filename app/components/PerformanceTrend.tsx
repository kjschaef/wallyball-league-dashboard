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

interface PlayerStats {
  id: number;
  name: string;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  winPercentage: number;
  actualWinPercentage?: number;
  inactivityPenalty?: number;
}

export function PerformanceTrend({ isExporting: _isExporting = false }: PerformanceTrendProps) {
  const [metric, setMetric] = useState<'winPercentage' | 'totalWins'>('winPercentage');
  const [showAllData, setShowAllData] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [chartData, setChartData] = useState<Array<{date: string; [key: string]: unknown}>>([]);
  const [loading, setLoading] = useState(true);

  // Fetch player stats and historical trends with contextual penalties
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, trendsResponse] = await Promise.all([
          fetch('/api/player-stats'),
          fetch('/api/player-trends')
        ]);

        if (!statsResponse.ok || !trendsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const statsData = await statsResponse.json();
        const trendsData = await trendsResponse.json();

        setPlayerStats(statsData);

        // Process trends data
        if (Array.isArray(trendsData) && trendsData.length > 0) {
          // Get all unique dates from trends data
          const allDates = new Set<string>();
          trendsData.forEach((playerTrend: any) => {
            if (playerTrend.dailyStats) {
              Object.keys(playerTrend.dailyStats).forEach(date => {
                allDates.add(date);
              });
            }
          });

          // Generate chart data
          const sortedDates = Array.from(allDates).sort();
          const dateRange = showAllData ? sortedDates : sortedDates.slice(-4);

          const newChartData = dateRange.map(date => {
            const dataPoint: any = { date };

            trendsData.forEach((playerTrend: any) => {
              if (playerTrend.dailyStats) {
                const stats = playerTrend.dailyStats[date];

                if (stats) {
                  dataPoint[playerTrend.name] = stats[metric];
                  // Debug specific penalty values
                  if (playerTrend.name.toLowerCase().includes('trevor') && stats.inactivityPenalty > 0) {
                    console.log(`Trevor on ${date}: raw=${stats.rawWinPercentage}%, penalty=${stats.inactivityPenalty}%, final=${stats.winPercentage}%`);
                  }
                } else {
                  // Find the last known value for this player before this date
                  const previousDates = sortedDates.filter(d => d < date);
                  let lastKnownValue = null;

                  for (let i = previousDates.length - 1; i >= 0; i--) {
                    const prevStats = playerTrend.dailyStats[previousDates[i]];
                    if (prevStats) {
                      lastKnownValue = prevStats[metric];
                      break;
                    }
                  }

                  if (lastKnownValue !== null) {
                    dataPoint[playerTrend.name] = lastKnownValue;
                  }
                }
              }
            });

            return dataPoint;
          });

          setChartData(newChartData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setPlayerStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [metric, showAllData]);

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
            {playerStats.map((player, index) => (
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