"use client";

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
import { PerformanceControls } from './PerformanceControls';
import { formatTooltip } from '../lib/tooltip';

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
  season?: string;
  onSeasonChange?: (season: string | undefined) => void;
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

export function PerformanceTrend({ isExporting: _isExporting = false, season: initialSeason, onSeasonChange }: PerformanceTrendProps) {
  const [metric, setMetric] = useState<'winPercentage' | 'totalWins'>('winPercentage');
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [chartData, setChartData] = useState<Array<{date: string; [key: string]: unknown}>>([]);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<string | undefined>(initialSeason);
  const [compare, setCompare] = useState<number[]>([]);

  // Fetch player stats and historical trends with contextual penalties
  // Keep internal season in sync with prop changes
  useEffect(() => {
    setSeason(initialSeason);
  }, [initialSeason]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build URLs with optional season parameter
        const seasonParam = season ? `season=${season}` : '';
        const [statsResponse, trendsResponse] = await Promise.all([
          fetch(`/api/player-stats${seasonParam ? `?${seasonParam}` : ''}`),
          fetch(`/api/player-trends${seasonParam ? `?${seasonParam}` : ''}`)
        ]);

        if (!statsResponse.ok || !trendsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const statsData = await statsResponse.json();
        const trendsDataResponse = await trendsResponse.json();

        setPlayerStats(statsData);
        setTrendsData(trendsDataResponse);
        
        // Debug the player stats structure
        console.log('Player Stats Sample:', statsData.slice(0, 2));
        console.log('Trends Data Sample:', trendsDataResponse.slice(0, 1));

        // Process trends data
        if (Array.isArray(trendsDataResponse) && trendsDataResponse.length > 0) {
          // Get all unique dates from trends data
          const allDates = new Set<string>();
          // Also compute last logged match date across players (for current season)
          let lastLoggedGameDate: string | null = null;

          trendsDataResponse.forEach((playerTrend: any) => {
            if (playerTrend.dailyStats) {
              const dates = Object.keys(playerTrend.dailyStats).sort();
              let prevTotalGames = -1;

              dates.forEach(date => {
                const stats = playerTrend.dailyStats[date];
                allDates.add(date);

                // detect a logged game by observing an increase in totalGames
                const totalGames = typeof stats.totalGames === 'number' ? stats.totalGames : NaN;
                if (prevTotalGames >= 0 && !isNaN(totalGames) && totalGames > prevTotalGames) {
                  // this date corresponds to a logged match for this player
                  if (!lastLoggedGameDate || date > lastLoggedGameDate) lastLoggedGameDate = date;
                }
                prevTotalGames = isNaN(totalGames) ? prevTotalGames : totalGames;
              });
            }
          });

          // Generate chart data - show all data for the selected season
          const sortedDates = Array.from(allDates).sort();
          let currentDateRange = sortedDates; // default

          // If viewing the current season, trim the date range to the last logged game date
          if (season === 'current' && lastLoggedGameDate) {
            currentDateRange = sortedDates.filter(d => d <= lastLoggedGameDate);
            // ensure we include the last logged date if present
            if (!currentDateRange.includes(lastLoggedGameDate)) currentDateRange.push(lastLoggedGameDate);
            currentDateRange = Array.from(new Set(currentDateRange)).sort();
          }
          setDateRange(currentDateRange);

          const newChartData = currentDateRange.map((date, index) => {
            const dataPoint: any = { date };
            const isLatestDate = index === currentDateRange.length - 1;

            trendsDataResponse.forEach((playerTrend: any) => {
              if (playerTrend.dailyStats) {
                const stats = playerTrend.dailyStats[date];

                if (stats) {
                  // For the latest date, use current stats from /api/player-stats to match player cards
                  const valueForMetric = (() => {
                    if (metric === 'winPercentage') {
                      return stats.winPercentage;
                    }
                    return stats[metric];
                  })();

                  if (isLatestDate && metric === 'winPercentage') {
                    const currentPlayer = statsData.find((p: any) => p.name === playerTrend.name);
                    if (currentPlayer) {
                      dataPoint[playerTrend.name] = currentPlayer.winPercentage;
                    } else {
                      dataPoint[playerTrend.name] = valueForMetric;
                    }
                  } else {
                    dataPoint[playerTrend.name] = valueForMetric;
                  }
                  // (debug logs removed)
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
                    // For the latest date, use current stats from /api/player-stats to match player cards
                    if (isLatestDate && metric === 'winPercentage') {
                      const currentPlayer = statsData.find((p: any) => p.name === playerTrend.name);
                      if (currentPlayer) {
                        dataPoint[playerTrend.name] = currentPlayer.winPercentage;
                      } else {
                        dataPoint[playerTrend.name] = lastKnownValue;
                      }
                    } else {
                      dataPoint[playerTrend.name] = lastKnownValue;
                    }
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
  }, [metric, season]);

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
      <div className="mb-6">
        <PerformanceControls season={season} metric={metric} compare={compare} onChange={(opts) => {
          if (opts.season !== undefined) {
            const newSeason = opts.season as string | undefined;
            setSeason(newSeason);
            if (onSeasonChange) onSeasonChange(newSeason);
          }
          if (opts.metric !== undefined) setMetric(opts.metric);
          if (opts.compare !== undefined) setCompare(opts.compare);
          if (opts.action === 'reset') {
            setMetric('winPercentage'); setCompare([]); setSeason(undefined);
          }
        }} />
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
            formatter={(value: number, name: string, props: any) =>
              formatTooltip(value, name, props, metric, trendsData, playerStats, dateRange)
            }
              itemSorter={(item) => {
                // Sort by value in descending order (highest win% at top)
                return -Number(item.value);
              }}
            />
            <Legend />
            {playerStats.map((player, index) => {
              const isCompared = compare.length === 0 ? true : compare.includes(player.id);
              const strokeOpacity = compare.length === 0 ? 1 : (isCompared ? 1 : 0.18);
              const strokeWidth = isCompared ? 3 : 1;
              return (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  activeDot={{ r: isCompared ? 6 : 0 }}
                  dot={false}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
