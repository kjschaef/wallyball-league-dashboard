'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [matches, setMatches] = useState<Array<{date: string; teamOnePlayers: string[]; teamTwoPlayers: string[]; teamOneGamesWon: number; teamTwoGamesWon: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{date: string; [key: string]: unknown}>>([]);
  const [playerData, setPlayerData] = useState<any[]>([]); // Added playerData state
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]); // Added selectedPlayers state

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
        setMatches(trendsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setPlayerStats([]);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data when playerStats, matches (trends), or metric changes
  useEffect(() => {
    if (!playerStats.length || !matches.length) return;

    // matches now contains trend data with contextual penalty calculations
    const trendsData = matches as any[];

    // Debug Trevor's data
    const trevorData = trendsData.find(p => p.name.toLowerCase().includes('trevor'));
    if (trevorData) {
      console.log('Trevor trend data:', trevorData.name, Object.keys(trevorData.dailyStats).length, 'data points');
      console.log('Trevor dates:', Object.keys(trevorData.dailyStats).sort());
      console.log('Trevor full data:', trevorData.dailyStats);
    }

    // Get all unique dates from trends data
    const allDates = new Set<string>();
    trendsData.forEach(playerTrend => {
      Object.keys(playerTrend.dailyStats).forEach(date => {
        allDates.add(date);
      });
    });

    // Generate chart data
    const sortedDates = Array.from(allDates).sort();
    const dateRange = showAllData ? sortedDates : sortedDates.slice(-4);

    const newChartData = dateRange.map(date => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataPoint: any = { date };

      trendsData.forEach(playerTrend => {
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
      });

      return dataPoint;
    });

    setChartData(newChartData);
  }, [playerStats, matches, metric, showAllData]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/player-trends');
        if (!response.ok) {
          throw new Error('Failed to fetch player trends');
        }
        const data = await response.json();
        // Ensure data is properly structured
        if (Array.isArray(data)) {
          setPlayerData(data);
        } else {
          console.error('Invalid data format received:', data);
          setPlayerData([]);
        }
      } catch (error) {
        console.error('Error fetching player trends:', error);
        setPlayerData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

    // Generate chart data with safe Map operations
  const chartData = useMemo(() => {
    if (!playerData || !Array.isArray(playerData) || playerData.length === 0) {
      return [];
    }

    try {
      // Create a Set to store all unique dates
      const allDatesSet = new Set();

      // Collect all dates from all players with safe property access
      playerData.forEach(player => {
        if (player && player.matches && Array.isArray(player.matches)) {
          player.matches.forEach(match => {
            if (match && match.date) {
              allDatesSet.add(match.date);
            }
          });
        }
      });

      // Convert to sorted array
      const sortedDates = Array.from(allDatesSet).sort();

      // Create chart data for each date
      return sortedDates.map(date => {
        const dataPoint = { date: format(parseISO(date), 'MMM dd') };

        playerData.forEach((player) => {
          if (player && player.name && selectedPlayers.includes(player.name)) {
            // Calculate win percentage up to this date with safe operations
            const matchesUpToDate = player.matches
              ?.filter(match => match && match.date && match.date <= date)
              ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (matchesUpToDate && matchesUpToDate.length > 0) {
              const wins = matchesUpToDate.reduce((sum, match) => {
                return sum + (match.wins || 0);
              }, 0);
              const total = matchesUpToDate.reduce((sum, match) => {
                return sum + (match.total || 0);
              }, 0);
              const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0;
              dataPoint[player.name] = winPercentage;
            }
          }
        });

        return dataPoint;
      });
    } catch (error) {
      console.error('Error generating chart data:', error);
      return [];
    }
  }, [playerData, selectedPlayers]);

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