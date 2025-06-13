import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SeasonStats {
  totalMatches: number;
  totalGames: number;
  avgGamesPerMatch: number;
}

interface SeasonStatisticsProps {
  stats: SeasonStats | null;
}

export function SeasonStatistics({ stats }: SeasonStatisticsProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Season Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="loading-stats" className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Matches</p>
            <p className="text-2xl font-bold">{stats.totalMatches}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Games</p>
            <p className="text-2xl font-bold">{stats.totalGames}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Avg Games per Match</p>
            <p className="text-2xl font-bold">{stats.avgGamesPerMatch}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}