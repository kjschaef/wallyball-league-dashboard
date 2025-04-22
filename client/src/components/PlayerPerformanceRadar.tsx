import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { calculateInactivityPenalty, calculatePenalizedWinPercentage } from "@/lib/utils";
import type { Player } from "@db/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ExtendedPlayer {
  id: number;
  name: string;
  matches: Array<{ won: boolean; date: string }>;
  stats: { won: number; lost: number; totalGames: number; totalMatchTime: number };
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  displayName: string;
  description: string;
  calculate: (player: ExtendedPlayer, allPlayers: ExtendedPlayer[]) => number;
  scale: [number, number]; // [min, max]
}

const performanceMetrics: PerformanceMetric[] = [
  {
    name: "winRate",
    displayName: "Win Rate",
    description: "Percentage of games won, adjusted for inactivity",
    calculate: (player) => {
      const { penalizedWinRate } = calculatePenalizedWinPercentage(player);
      return penalizedWinRate;
    },
    scale: [0, 100],
  },
  {
    name: "consistency",
    displayName: "Consistency",
    description: "Measure of how consistently a player performs across games",
    calculate: (player) => {
      // Calculate winning streaks and losing streaks
      const { matches } = player;
      if (!matches || matches.length === 0) return 0;

      let maxWinStreak = 0;
      let currentWinStreak = 0;
      let maxLoseStreak = 0;
      let currentLoseStreak = 0;
      let streakChanges = 0;
      let lastWasWin: boolean | null = null;

      // Sort matches by date (oldest first)
      const sortedMatches = [...matches].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sortedMatches.forEach((match) => {
        if (match.won) {
          currentWinStreak++;
          currentLoseStreak = 0;
          if (lastWasWin === false) streakChanges++;
          lastWasWin = true;
          maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else {
          currentLoseStreak++;
          currentWinStreak = 0;
          if (lastWasWin === true) streakChanges++;
          lastWasWin = false;
          maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
        }
      });

      // Consistency formula: 100 - ratio of streak changes to total matches * 100
      // Higher streak changes = lower consistency
      const totalMatches = matches.length;
      const streakChangeRatio = streakChanges / totalMatches;
      
      // The formula maps to a 0-100 scale where:
      // 0 streak changes (perfect consistency) = 100
      // Maximum changes (complete inconsistency) = 0
      const consistencyScore = 100 - (streakChangeRatio * 100);
      
      return consistencyScore;
    },
    scale: [0, 100],
  },
  {
    name: "improvement",
    displayName: "Improvement",
    description: "How much a player has improved recently compared to their historical performance",
    calculate: (player) => {
      const { matches } = player;
      if (!matches || matches.length < 5) return 50; // Neutral if not enough data
      
      // Sort matches by date (oldest first)
      const sortedMatches = [...matches].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Split matches into earlier half and later half
      const midpoint = Math.floor(sortedMatches.length / 2);
      const earlierMatches = sortedMatches.slice(0, midpoint);
      const laterMatches = sortedMatches.slice(midpoint);
      
      // Calculate win rates for both periods
      const earlierWins = earlierMatches.filter(m => m.won).length;
      const earlierRate = earlierWins / earlierMatches.length;
      
      const laterWins = laterMatches.filter(m => m.won).length;
      const laterRate = laterWins / laterMatches.length;
      
      // Calculate improvement as percentage change
      const improvementPercent = ((laterRate - earlierRate) / Math.max(0.1, earlierRate)) * 100;
      
      // Map to 0-100 scale where:
      // -50% or worse (significant decline) = 0
      // 0% (no change) = 50
      // +50% or better (significant improvement) = 100
      return Math.max(0, Math.min(100, improvementPercent + 50));
    },
    scale: [0, 100],
  },
  {
    name: "volume",
    displayName: "Play Volume",
    description: "How frequently a player participates in games relative to other players",
    calculate: (player, allPlayers) => {
      if (!allPlayers || allPlayers.length === 0) return 0;
      
      // Find the max number of matches in the league
      const maxMatches = Math.max(...allPlayers.map(p => (p.matches || []).length));
      if (maxMatches === 0) return 0;
      
      // Calculate normalized score (0-100)
      return ((player.matches || []).length / maxMatches) * 100;
    },
    scale: [0, 100],
  },
  
];

export function PlayerPerformanceRadar() {
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<string[]>(performanceMetrics.map(m => m.name));
  const [expandedView, setExpandedView] = useState(false);

  const { data: players = [] } = useQuery<ExtendedPlayer[]>({
    queryKey: ["/api/players"],
  });

  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId) 
        : [...prev, playerId].slice(-3) // Limit to 3 players for better visibility
    );
  };

  const handleMetricToggle = (metricName: string) => {
    setMetrics(prev => 
      prev.includes(metricName) 
        ? prev.filter(name => name !== metricName) 
        : [...prev, metricName]
    );
  };

  // Prepare data for the radar chart
  const radarData = metrics.map(metricName => {
    const metric = performanceMetrics.find(m => m.name === metricName);
    if (!metric) return null;
    
    const dataPoint: Record<string, any> = { 
      metric: metric.displayName,
      fullMark: 100,
    };
    
    players
      .filter(player => selectedPlayers.includes(player.id))
      .forEach(player => {
        const value = metric.calculate(player, players);
        dataPoint[player.name] = value;
      });
    
    return dataPoint;
  }).filter(Boolean);

  // Choose colors for players
  const playerColors: Record<string, string> = {
    // Predefined colors for each potential player
    0: "#FF6B6B", // Coral Red
    1: "#4ECDC4", // Turquoise
    2: "#FFD93D", // Sun Yellow
    3: "#6C5CE7", // Deep Purple
    4: "#A8E6CF", // Mint Green
  };

  return (
    <Card className={`${expandedView ? "col-span-full" : "col-span-1"} border-4 border-primary rounded-xl w-full`}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Player Performance Analysis</CardTitle>
            <CardDescription className="mt-1">
              Compare players across multiple performance metrics
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={() => setExpandedView(!expandedView)}
            >
              {expandedView ? "Compact View" : "Expanded View"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6 lg:col-span-1 order-1 lg:order-none">
            <div className="bg-muted/50 border border-dashed rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Select Players (max 3)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                {players
                  .sort((a, b) => {
                    // Sort by most games played
                    return (b.matches?.length || 0) - (a.matches?.length || 0);
                  })
                  .map((player, index) => (
                    <div key={player.id} className="flex items-center bg-muted/30 rounded-md p-2">
                      <Checkbox 
                        id={`player-${player.id}`} 
                        checked={selectedPlayers.includes(player.id)}
                        onCheckedChange={() => handlePlayerToggle(player.id)}
                        style={{
                          backgroundColor: selectedPlayers.includes(player.id) 
                            ? playerColors[selectedPlayers.indexOf(player.id)] 
                            : undefined
                        }}
                        className="flex-shrink-0 mr-2"
                      />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <Label 
                          className="text-sm font-medium block w-full" 
                          htmlFor={`player-${player.id}`}
                        >
                          {player.name} <span className="text-xs text-muted-foreground">({player.matches?.length || 0})</span>
                        </Label>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
              <div className="space-y-2">
                {performanceMetrics.map((metric) => (
                  <div key={metric.name} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`metric-${metric.name}`} 
                      checked={metrics.includes(metric.name)}
                      onCheckedChange={() => handleMetricToggle(metric.name)}
                    />
                    <div className="flex items-center">
                      <Label htmlFor={`metric-${metric.name}`}>{metric.displayName}</Label>
                      <Popover>
                        <PopoverTrigger>
                          <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent side="right" className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">{metric.displayName}</h4>
                            <p className="text-sm text-muted-foreground">{metric.description}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 col-span-1 order-2 lg:order-none min-h-[350px] sm:min-h-[400px]">
            {selectedPlayers.length > 0 ? (
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={expandedView ? 130 : 90}
                    data={radarData}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    
                    {players
                      .filter(player => selectedPlayers.includes(player.id))
                      .map((player, index) => (
                        <Radar
                          key={player.id}
                          name={player.name}
                          dataKey={player.name}
                          stroke={playerColors[selectedPlayers.indexOf(player.id)]}
                          fill={playerColors[selectedPlayers.indexOf(player.id)]}
                          fillOpacity={0.3}
                        />
                      ))}
                    
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Select at least one player to view the performance radar
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}