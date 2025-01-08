import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { Users, Trophy, Percent, Calendar } from "lucide-react";

export default function Dashboard() {
  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const totalPlayers = players?.length || 0;
  const totalMatches = players?.reduce(
    (acc, player) => acc + player.matches.length,
    0
  ) || 0;
  
  const totalWins = players?.reduce(
    (acc, player) =>
      acc + player.matches.reduce((sum: number, match: any) => sum + match.won, 0),
    0
  ) || 0;

  const winRate = totalMatches
    ? ((totalWins / totalMatches) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">League Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Players"
          value={totalPlayers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Matches"
          value={totalMatches}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Wins"
          value={totalWins}
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Average Win Rate"
          value={`${winRate}%`}
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}
