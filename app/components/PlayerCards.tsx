'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Edit, Trash2 } from 'lucide-react';

interface PlayerStats {
  id: number;
  name: string;
  yearsPlayed: number;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  winPercentage: number;
  totalPlayingTime: number;
  streak: {
    type: 'wins' | 'losses';
    count: number;
  };
  actualWinPercentage?: number;
  inactivityPenalty?: number;
}

function formatPlayingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

function getWinPercentageColor(percentage: number): string {
  if (percentage >= 60) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

interface PlayerCardProps {
  player: PlayerStats;
}

function PlayerCard({ player }: PlayerCardProps) {
  const hasInactivityPenalty = player.inactivityPenalty && player.inactivityPenalty > 0;
  
  return (
    <Card className="relative p-4 bg-white border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header with name and years */}
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {player.name}
          </CardTitle>
          <div className="flex gap-1">
            <button className="p-1 hover:bg-gray-100 rounded">
              <Edit className="h-4 w-4 text-gray-500" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Trash2 className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">Years played: {player.yearsPlayed}</p>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Record and Win Percentage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Record</p>
            <p className="text-sm font-medium text-green-600">
              {player.record.wins} - {player.record.losses}
            </p>
            <p className="text-xs text-gray-500">{player.record.totalGames} games</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Win Percentage</p>
            <p className="text-2xl font-bold text-gray-900">
              {player.winPercentage}%
            </p>
            {hasInactivityPenalty && (
              <p className="text-xs text-red-500">
                Actual: {player.actualWinPercentage}% (-{player.inactivityPenalty}% inactive)
              </p>
            )}
          </div>
        </div>

        {/* Win Percentage Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getWinPercentageColor(player.winPercentage)}`}
            style={{ width: `${Math.min(player.winPercentage, 100)}%` }}
          />
        </div>

        {/* Total Playing Time */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Playing Time</p>
          <p className="text-sm font-medium text-gray-900">
            {formatPlayingTime(player.totalPlayingTime)}
          </p>
        </div>

        {/* Streak */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Streak</p>
          <p className="text-sm font-medium text-gray-900">
            {player.streak.count} {player.streak.count === 1 ? 'week' : 'weeks'}
          </p>
        </div>

        {/* Achievement placeholders - leaving empty as requested */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          {/* Achievement icons would go here but were requested to be skipped */}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlayerCards() {
  const { data: playerStats, isLoading, error } = useQuery<PlayerStats[]>({
    queryKey: ['/api/player-stats'],
    queryFn: () => fetch('/api/player-stats').then((res) => res.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Failed to load player statistics. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!playerStats || playerStats.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
        <div className="p-8 text-center border border-gray-200 rounded-lg">
          <p className="text-gray-500">No players found. Add some players to see their statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Player Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playerStats.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}