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
    </div>
  );
}