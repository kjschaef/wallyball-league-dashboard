import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateInactivityPenalty } from "@/lib/utils";

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

interface PlayerMatch {
  date: string;
  isTeamOne: boolean;
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export function PerformanceTrend({ isExporting = false }: PerformanceTrendProps) {
  const [showAllData, setShowAllData] = useState(false);
  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  if (!players) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px] flex items-center justify-center">
            Loading player data...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process player data to calculate win percentages
  // Get most recent date with matches
  const mostRecentDate = players
    .flatMap(player => player.matches || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;

  // Defining the match type to fix the type error
  interface Match {
    date: string;
    isTeamOne: boolean;
    teamOneGamesWon?: number;
    teamTwoGamesWon?: number;
    [key: string]: any;
  }

  // Get players from most recent date
  const recentPlayerIds = new Set(
    players
      .flatMap(player => (player.matches || []).map((match: Match) => ({
        ...match,
        playerId: player.id
      })))
      .filter(match => new Date(match.date).toDateString() === new Date(mostRecentDate).toDateString())
      .flatMap(match => [
        match.isTeamOne ? match.playerId : null,
        !match.isTeamOne ? match.playerId : null,
      ])
      .filter((id): id is number => id !== null)
  );

  const playerStats = players.map((player) => {
    const dailyStats = new Map();
    let cumulativeWins = 0;
    let cumulativeTotalGames = 0;
    let daysPlayed = new Set();
    const isRecent = recentPlayerIds.has(player.id);

    // Sort matches by date
    const sortedMatches = [...(player.matches || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedMatches.forEach((match) => {
      const date = format(new Date(match.date), "yyyy-MM-dd");
      const gamesWon = match.isTeamOne ? match.teamOneGamesWon || 0 : match.teamTwoGamesWon || 0;
      const gamesLost = match.isTeamOne ? match.teamTwoGamesWon || 0 : match.teamOneGamesWon || 0;
      const totalGames = gamesWon + gamesLost;
      
      cumulativeWins += gamesWon;
      cumulativeTotalGames += totalGames;
      daysPlayed.add(date);
      
      // Calculate win percentage (handle division by zero)
      const winPercentage = cumulativeTotalGames > 0 
        ? (cumulativeWins / cumulativeTotalGames) * 100 
        : 0;
        
      dailyStats.set(date, { 
        winPercentage: winPercentage,
        winsPerDay: cumulativeWins / daysPlayed.size,
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

  const chartData = showAllData 
    ? Array.from(allDates)
      .sort()
      .map(date => {
        const dataPoint: any = { date };
        playerStats.forEach(player => {
          const stats = player.dailyStats.get(date);
          if (stats) {
            dataPoint[player.name] = stats[metric];
          } else {
            const lastPlayDate = Array.from(player.dailyStats.keys())
              .filter(d => d <= date)
              .sort()
              .pop();

            if (lastPlayDate) {
              const daysSinceLastPlay = Math.floor(
                (new Date(date).getTime() - new Date(lastPlayDate).getTime()) / 
                (1000 * 60 * 60 * 24)
              );
              
              // Calculate inactivity as of the chart date, not today
              const chartDate = new Date(date);
              const lastActivityDate = new Date(lastPlayDate);
              
              // Calculate inactivity time in days
              const daysSinceLastActivity = Math.floor(
                (chartDate.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000)
              );
              
              // No penalty for first 2 weeks
              const gracePeriodDays = 14;
              const excessInactiveDays = Math.max(0, daysSinceLastActivity - gracePeriodDays);
              
              // Calculate weeks inactive beyond grace period (5% per week)
              const weeksInactive = Math.floor(excessInactiveDays / 7);
              const penaltyPerWeek = 0.05; // 5% per week
              const maxPenalty = 0.5; // 50% maximum penalty
              
              // Calculate penalty gradually
              const inactivityPenalty = Math.min(maxPenalty, weeksInactive * penaltyPerWeek);
              const decayFactor = 1 - inactivityPenalty;
              
              console.log(`Player ${player.name} on ${date}: ${daysSinceLastActivity} days since activity, penalty: ${Math.round(inactivityPenalty * 100)}%`);
              
              const value = player.dailyStats.get(lastPlayDate)[metric];
              
              // Apply the penalty to all metrics, but store information about the penalty
              dataPoint[player.name] = value * decayFactor;
              // Store the penalty information for the tooltip
              dataPoint[`${player.name}_penalty`] = inactivityPenalty;
            } else {
              dataPoint[player.name] = 0;
            }
          }
        });
        return dataPoint;
      })
    : (() => {
        const weeklyAcc = Array.from(allDates)
          .sort()
          .reduce((acc, date) => {
            const weekStart = format(startOfWeek(new Date(date)), 'yyyy-MM-dd');
            if (!acc[weekStart]) {
              acc[weekStart] = { date: weekStart, games: {} };
              playerStats.forEach(player => {
                acc[weekStart].games[player.name] = [];
              });
            }
            playerStats.forEach(player => {
              const stats = player.dailyStats.get(date);
              if (stats) {
                acc[weekStart].games[player.name].push(stats[metric]);
              }
            });
            return acc;
          }, {} as any);

    // Transform the accumulated data into weekly data points
    const weeklyAccumulated = Array.from(allDates)
      .sort()
      .reduce((acc, date) => {
        const weekStart = format(startOfWeek(new Date(date)), 'yyyy-MM-dd');
        if (!acc[weekStart]) {
          acc[weekStart] = { date: weekStart, games: {} };
          playerStats.forEach(player => {
            acc[weekStart].games[player.name] = [];
          });
        }
        playerStats.forEach(player => {
          const stats = player.dailyStats.get(date);
          if (stats) {
            acc[weekStart].games[player.name].push(stats[metric]);
          }
        });
        return acc;
      }, {} as any);

    const weeklyData = Object.values(weeklyAccumulated)
      .slice(-4)
      .map((weekData: any) => {
        const dataPoint: any = { date: weekData.date };
        playerStats.forEach(player => {
          const playerGames = weekData.games[player.name];
          if (playerGames.length > 0) {
            dataPoint[player.name] = playerGames.reduce((a: number, b: number) => a + b, 0) / playerGames.length;
          } else {
            dataPoint[player.name] = 0;
          }
        });
        return dataPoint;
      });

      // Process the data to handle missing values with inactivity penalty
      return weeklyData.map((dataPoint, index) => {
        const processedDataPoint = { ...dataPoint };
        const currentWeekDate = new Date(dataPoint.date);
        
        playerStats.forEach(player => {
          if (processedDataPoint[player.name] === 0) {
            // Find the last known value
            let lastValue = 0;
            let lastValueIndex = -1;
            
            for (let i = index - 1; i >= 0; i--) {
              if (weeklyData[i][player.name] !== 0) {
                lastValue = weeklyData[i][player.name];
                lastValueIndex = i;
                break;
              }
            }
            
            if (lastValueIndex >= 0) {
              // Get the date of last activity
              const lastActiveWeekDate = new Date(weeklyData[lastValueIndex].date);
              
              // Calculate inactivity as of the current week date, not today
              const currentDate = currentWeekDate;
              const lastActivityDate = lastActiveWeekDate;
              
              // Calculate inactivity time in days
              const daysSinceLastActivity = Math.floor(
                (currentDate.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000)
              );
              
              // No penalty for first 2 weeks
              const gracePeriodDays = 14;
              const excessInactiveDays = Math.max(0, daysSinceLastActivity - gracePeriodDays);
              
              // Calculate weeks inactive beyond grace period (5% per week)
              const weeksInactive = Math.floor(excessInactiveDays / 7);
              const penaltyPerWeek = 0.05; // 5% per week
              const maxPenalty = 0.5; // 50% maximum penalty
              
              // Calculate penalty gradually
              const inactivityPenalty = Math.min(maxPenalty, weeksInactive * penaltyPerWeek);
              const decayFactor = 1 - inactivityPenalty;
              
              console.log(`Weekly view - ${player.name} on week of ${format(currentDate, 'MMM d')}: ${daysSinceLastActivity} days since activity, penalty: ${Math.round(inactivityPenalty * 100)}%`);
              const penalizedValue = lastValue * decayFactor;
              
              processedDataPoint[player.name] = penalizedValue;
              // Store the penalty information
              processedDataPoint[`${player.name}_penalty`] = inactivityPenalty;
            }
          }
        });
        return processedDataPoint;
      });
    })();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Win Percentage</CardTitle>
        <div className="flex flex-col gap-2">
          <ToggleGroup
            type="single"
            value={showAllData ? "all" : "recent"}
            onValueChange={(value) => setShowAllData(value === "all")}
            className="border rounded-lg w-[200px]"
          >
            <ToggleGroupItem value="recent" className="px-3 h-9 flex-1 data-[state=on]:bg-black data-[state=on]:text-white">
              Recent
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="px-3 h-9 flex-1 data-[state=on]:bg-black data-[state=on]:text-white">
              All Data
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(parseISO(date), "MMM d")}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${Math.round(value)}%`}
                label={{ 
                  value: 'Win %', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip
                labelFormatter={(date) => format(parseISO(date as string), "MMM d, yyyy")}
                formatter={(value: number, name: string, entry: any) => {
                  if (name.includes('_penalty')) return null; // Skip penalty fields in tooltip
                  
                  const formattedValue = Number(value.toFixed(1));
                  let displayValue: string | number = metric === 'winPercentage' 
                    ? `${formattedValue}%` 
                    : formattedValue;
                  
                  // Check if this player has an inactivity penalty applied
                  const penaltyKey = `${name}_penalty`;
                  if (entry.payload[penaltyKey]) {
                    const penalty = entry.payload[penaltyKey];
                    const penaltyPercent = Math.round(penalty * 100);
                    
                    // Only show penalty if it's significant (>1%)
                    if (penaltyPercent > 1) {
                      // Create penalty message as a string to avoid TypeScript issues with React elements
                      displayValue = `${displayValue} (${penaltyPercent}% inactive penalty)`;
                    }
                  }
                  
                  return [displayValue, name];
                }}
                contentStyle={{ 
                  fontWeight: recentPlayerIds.has(playerStats.find(p => p.name === name)?.id || 0) ? 'bold' : 'normal',
                  borderRadius: '8px' 
                }}
                itemSorter={(a) => {
                  if (typeof a.dataKey === 'string' && a.dataKey.includes('_penalty')) return -9999; // Hide penalty items from tooltip
                  return a.value !== undefined ? -a.value : 0;
                }}
              />
              <Legend formatter={(value: string) => {
                // Only process player names, not penalty keys
                if (value.includes('_penalty')) return null;
                
                const playerId = playerStats.find(p => p.name === value)?.id;
                return recentPlayerIds.has(playerId || 0) ? value : value;
              }} />
              {[...playerStats]
                .sort((a, b) => {
                  const aIsRecent = recentPlayerIds.has(a.id);
                  const bIsRecent = recentPlayerIds.has(b.id);
                  if (aIsRecent && !bIsRecent) return -1;
                  if (!aIsRecent && bIsRecent) return 1;
                  return 0;
                })
                .map((player, index) => (
                  <Line
                    key={player.id}
                    type="monotone"
                    dataKey={player.name}
                    stroke={COLORS[playerStats.findIndex(p => p.id === player.id) % COLORS.length]}
                    strokeWidth={recentPlayerIds.has(player.id) ? 3 : 1.5}
                    strokeOpacity={recentPlayerIds.has(player.id) ? 1 : 0.6}
                    dot={{ r: recentPlayerIds.has(player.id) ? 5 : 3 }}
                    activeDot={{ r: recentPlayerIds.has(player.id) ? 7 : 5 }}
                    name={player.name}
                    isAnimationActive={!isExporting}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold mb-2 text-sm">
            Win Percentage Rankings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {playerStats
              .map(player => {
                const lastDataPoint = chartData[chartData.length - 1];
                return {
                  id: player.id,
                  name: player.name,
                  value: lastDataPoint[player.name] || 0,
                  penaltyApplied: lastDataPoint[`${player.name}_penalty`] || 0
                };
              })
              .sort((a, b) => b.value - a.value)
              .map((player, index) => {
                const color = COLORS[playerStats.findIndex(p => p.name === player.name) % COLORS.length];
                const fullStats = playerStats.find(p => p.id === player.id);
                const playerMatches = players.find(p => p.id === player.id)?.matches || [];
                const matchesCount = playerMatches.length;
                
                return (
                  <div 
                    key={player.name}
                    className={cn(
                      "flex items-center justify-between px-2 py-2.5 bg-muted rounded-lg",
                      recentPlayerIds.has(player.id) && "border-2"
                    )}
                    style={{ 
                      borderColor: recentPlayerIds.has(player.id) ? color : 'transparent',
                      borderLeftWidth: '3px'
                    }}
                  >
                    <div className="flex items-center gap-1 min-w-0 flex-grow mr-1.5">
                      <span className="text-[0.65rem] sm:text-xs shrink-0 text-muted-foreground">{index + 1}.</span>
                      <div className="min-w-0 flex-grow">
                        <span className="text-[0.7rem] sm:text-sm font-bold block truncate" style={{ color }}>{player.name}</span>
                        {metric === 'winPercentage' && (
                          <span className="text-[0.6rem] sm:text-xs text-muted-foreground block">
                            {matchesCount} games played
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      <span className="text-xs sm:text-base font-semibold" style={{ color }}>
                        {metric === 'winPercentage' 
                          ? `${player.value.toFixed(1)}%` 
                          : player.value.toFixed(1)}
                      </span>
                      {player.penaltyApplied > 0.02 && (
                        <div className="text-[0.6rem] text-right text-muted-foreground">
                          -{Math.round(player.penaltyApplied * 100)}% inactive
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}