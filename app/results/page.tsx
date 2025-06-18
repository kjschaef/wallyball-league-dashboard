"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PlayerCards } from "../components/PlayerCards";

interface SeasonStats {
  totalMatches: number;
  totalGames: number;
  avgGamesPerMatch: number;
}

interface TeamPerformance {
  id: number;
  players: string[];
  wins: number;
  losses: number;
  winPercentage: number;
  totalGames: number;
  gameWins: number;
  gameLosses: number;
  totalIndividualGames: number;
  gameWinPercentage: number;
}

function SeasonStatistics({ stats }: { stats: SeasonStats | null }) {
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

function BestPerformingTeams({
  teams,
  minGames,
}: {
  teams: TeamPerformance[] | null;
  minGames: number;
}) {
  const formatTeamName = (players: string[]): string => {
    if (players.length <= 2) {
      return players.join(" and ");
    }
    const lastPlayer = players[players.length - 1];
    const otherPlayers = players.slice(0, -1);
    return `${otherPlayers.join(", ")} and ${lastPlayer}`;
  };

  const getWinPercentageColor = (percentage: number): string => {
    if (percentage >= 85) return "text-green-600";
    if (percentage >= 75) return "text-green-500";
    if (percentage >= 65) return "text-yellow-600";
    return "text-red-500";
  };

  if (!teams) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Best Performing Teams (Min. {minGames} Matches)</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="loading-teams" className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 bg-gray-50 rounded"
              >
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const qualifiedTeams = (teams || [])
    .filter((team) => team.totalIndividualGames >= minGames)
    .sort((a, b) => b.gameWinPercentage - a.gameWinPercentage)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Performing Teams (Min. {minGames} Games)</CardTitle>
      </CardHeader>
      <CardContent>
        {qualifiedTeams.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No teams meet the minimum games requirement
          </p>
        ) : (
          <div className="space-y-3">
            {qualifiedTeams.map((team) => (
              <div
                key={team.id}
                data-testid="team-row"
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {formatTeamName(team.players)}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {team.gameWins}W - {team.gameLosses}L
                  </div>
                  <div
                    className={`text-sm font-semibold ${getWinPercentageColor(team.gameWinPercentage)}`}
                  >
                    {Math.round(team.gameWinPercentage)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResultsPage() {
  const { data: seasonStats } = useQuery<SeasonStats>({
    queryKey: ["/api/season-stats"],
    queryFn: () => fetch("/api/season-stats").then((res) => res.json()),
  });

  const { data: teamPerformance } = useQuery<TeamPerformance[]>({
    queryKey: ["/api/team-performance"],
    queryFn: () => fetch("/api/team-performance").then((res) => res.json()),
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Results & Standings</h1>

      <SeasonStatistics stats={seasonStats || null} />

      <BestPerformingTeams teams={teamPerformance || null} minGames={10} />

      <PlayerCards />
    </div>
  );
}
