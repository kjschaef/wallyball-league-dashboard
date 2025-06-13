import { useQuery } from "@tanstack/react-query";
import { SeasonStatistics } from "../components/SeasonStatistics";
import { BestPerformingTeams } from "../components/BestPerformingTeams";

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
}

export default function Results() {
  const { data: seasonStats } = useQuery<SeasonStats>({
    queryKey: ["/api/season-stats"],
    queryFn: () => fetch("/api/season-stats").then(res => res.json()),
  });

  const { data: teamPerformance } = useQuery<TeamPerformance[]>({
    queryKey: ["/api/team-performance"],
    queryFn: () => fetch("/api/team-performance").then(res => res.json()),
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Results & Standings</h1>
      
      <SeasonStatistics stats={seasonStats || null} />
      
      <BestPerformingTeams teams={teamPerformance || null} minGames={6} />

      {/* Player Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players
          ?.sort((a, b) => {
            const { penalizedWinRate: aWinRate } = calculatePenalizedWinPercentage(a);
            const { penalizedWinRate: bWinRate } = calculatePenalizedWinPercentage(b);
            return bWinRate - aWinRate;
          })
          .map((player) => {
            const sortedPlayer = {
              ...player,
              matches: [...(player.matches || [])].sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              )
            };

            return (
              <PlayerCard
                key={player.id}
                player={sortedPlayer}
                onEdit={(player) => setDialogState({ isOpen: true, player })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            );
          })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Achievement Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🏐
              </div>
              <span className="text-sm">First Game Played</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🏆
              </div>
              <span className="text-sm">Won 5 Games</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🗓️
              </div>
              <span className="text-sm">Played 10 Games</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                🎯
              </div>
              <span className="text-sm">70% Win Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                👥
              </div>
              <span className="text-sm">Played with 5 Different Teammates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                👑
              </div>
              <span className="text-sm">Perfect Game Victory</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Playing Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="min-h-[400px] relative pb-4">
              {players?.sort((a, b) => (b.stats.totalMatchTime || 0) - (a.stats.totalMatchTime || 0))
                .map((player, i) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-2 mb-2"
                  title={`Total playing time: ${player.stats.totalMatchTime} hours\nBased on 90-minute daily sessions`}
                >
                  <div className="w-24 truncate">{player.name}</div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ 
                        width: `${(player.stats.totalMatchTime / Math.max(...players.map(p => p.stats.totalMatchTime || 0))) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    {player.stats.totalMatchTime}h
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Common Team Matchups</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-muted-foreground">No matches recorded yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  matches.reduce(
                    (acc, match) => {
                      const teamOne = formatTeam([...match.teamOnePlayers].sort());
                      const teamTwo = formatTeam([...match.teamTwoPlayers].sort());
                      const matchupKey = [teamOne, teamTwo].sort().join(" vs ");

                      if (!acc[matchupKey]) {
                        acc[matchupKey] = {
                          count: 0,
                          teamOneWins: 0,
                          teamTwoWins: 0,
                          totalGames: 0,
                        };
                      }

                      acc[matchupKey].count += 1;
                      acc[matchupKey].teamOneWins += match.teamOneGamesWon;
                      acc[matchupKey].teamTwoWins += match.teamTwoGamesWon;
                      acc[matchupKey].totalGames +=
                        match.teamOneGamesWon + match.teamTwoGamesWon;

                      return acc;
                    },
                    {} as Record<
                      string,
                      {
                        count: number;
                        teamOneWins: number;
                        teamTwoWins: number;
                        totalGames: number;
                      }
                    >,
                  ),
                )
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 5)
                  .map(([matchup, stats]) => (
                    <div
                      key={matchup}
                      className="flex flex-col p-2 hover:bg-muted/50 rounded"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {(() => {
                            const teams = matchup.split(" vs ");
                            const teamOneWins = stats.teamOneWins;
                            const teamTwoWins = stats.teamTwoWins;
                            const teamWithMoreWins = teamOneWins > teamTwoWins ? 0 : 
                                                   teamTwoWins > teamOneWins ? 1 : -1;

                            if (teamWithMoreWins === 0) {
                              return (
                                <>
                                  <span className="text-green-600 font-semibold">
                                    {teams[0]}
                                  </span>
                                  <span className="mx-1">vs</span>
                                  <span>
                                    {teams[1]}
                                  </span>
                                </>
                              );
                            } else if (teamWithMoreWins === 1) {
                              return (
                                <>
                                  <span>
                                    {teams[0]}
                                  </span>
                                  <span className="mx-1">vs</span>
                                  <span className="text-green-600 font-semibold">
                                    {teams[1]}
                                  </span>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <span>
                                    {teams[0]}
                                  </span>
                                  <span className="mx-1">vs</span>
                                  <span>
                                    {teams[1]}
                                  </span>
                                </>
                              );
                            }
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Played {stats.count} times
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <div>
                          {(() => {
                            const teamOneWins = stats.teamOneWins;
                            const teamTwoWins = stats.teamTwoWins;
                            const teamWithMoreWins = teamOneWins > teamTwoWins ? 0 : teamTwoWins > teamOneWins ? 1 : -1;
                            if (teamWithMoreWins === 0) {
                              return (
                                <>
                                  Record: <span className="text-green-600">{teamOneWins}</span>-{teamTwoWins}
                                </>
                              );
                            } else if (teamWithMoreWins === 1) {
                              return (
                                <>
                                  Record: <span className="text-green-600">{teamTwoWins}</span>-{teamOneWins}
                                </>
                              );
                            } else {
                              return (
                                <>
                                  Record: {teamOneWins}-{teamTwoWins} (Tied)
                                </>
                              );
                            }
                          })()}
                        </div>
                        <div>
                          Average games per match:{" "}
                          {(stats.totalGames / stats.count).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}