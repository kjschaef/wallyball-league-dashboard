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
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
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
    if (percentage > 53) return "text-green-600";
    if (percentage >= 45) return "text-yellow-600";
    return "text-red-600";
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
                className="flex justify-between items-center p-4 bg-gray-200 rounded"
              >
                <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-gray-300 rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-gray-300 rounded animate-pulse w-12"></div>
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
          <div className="space-y-2">
            {qualifiedTeams.map((team, index) => (
              <div
                key={team.id}
                data-testid="team-row"
                className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-4">
                    {index + 1}.
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatTeamName(team.players)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {team.gameWins}W - {team.gameLosses}L
                  </span>
                  <span
                    className={`text-sm font-semibold ${getWinPercentageColor(team.gameWinPercentage)}`}
                  >
                    {Math.round(team.gameWinPercentage)}%
                  </span>
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
    queryKey: ["/api/matches", { stats: true }],
    queryFn: () => fetch("/api/matches?stats=true").then((res) => res.json()),
  });

  const { data: teamPerformance } = useQuery<TeamPerformance[]>({
    queryKey: ["/api/team-performance"],
    queryFn: () => fetch("/api/team-performance").then((res) => res.json()),
  });

  const { data: exemptions, refetch } = useQuery<any[]>({
    queryKey: ["/api/inactivity-exemptions"],
    queryFn: () => fetch("/api/inactivity-exemptions").then((res) => res.json()),
  });

  const handleDelete = async (id: number) => {
    await fetch(`/api/inactivity-exemptions?id=${id}` , { method: 'DELETE' });
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Results & Standings</h1>

      <SeasonStatistics stats={seasonStats || null} />

      <BestPerformingTeams teams={teamPerformance || null} minGames={10} />

      <PlayerCards />

      <div className="bg-white border rounded p-4">
        <h2 className="text-xl font-semibold mb-3">Inactivity Exemptions</h2>
        {!exemptions ? (
          <div className="text-gray-500">Loading...</div>
        ) : exemptions.length === 0 ? (
          <div className="text-gray-500">No exemptions added yet.</div>
        ) : (
          <div className="space-y-2">
            {exemptions.map((ex) => (
              <div key={ex.id} className="flex justify-between items-center border rounded p-2">
                <div className="text-sm">
                  <div className="font-medium">Player #{ex.playerId}</div>
                  <div className="text-gray-600">{ex.reason || '—'}</div>
                  <div className="text-gray-600">
                    {(() => {
                      const start = ex.startDate ? new Date(ex.startDate).toLocaleDateString() : null;
                      const end = ex.endDate ? new Date(ex.endDate).toLocaleDateString() : null;
                      if (start && end) return `${start} — ${end}`;
                      if (start) return `Starts ${start}`;
                      if (end) return `Ends ${end}`;
                      return '—';
                    })()}
                  </div>
                </div>
                <button className="text-red-600 text-sm" onClick={() => handleDelete(ex.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
