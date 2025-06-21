import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface TeamPerformance {
  id: number;
  players: string[];
  wins: number;
  losses: number;
  winPercentage: number;
  totalGames: number;
}

interface BestPerformingTeamsProps {
  teams: TeamPerformance[] | null;
  minGames: number;
}

export function BestPerformingTeams({
  teams,
  minGames,
}: BestPerformingTeamsProps) {
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
          <CardTitle>Best Performing Teams (Min. {minGames} Games)</CardTitle>
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

  const qualifiedTeams = teams
    .filter((team) => team.totalGames >= minGames)
    .sort((a, b) => b.winPercentage - a.winPercentage);

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
                    {team.wins}W - {team.losses}L
                  </div>
                  <div
                    className={`text-sm font-semibold ${getWinPercentageColor(team.winPercentage)}`}
                  >
                    {Math.round(team.winPercentage)}%
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
