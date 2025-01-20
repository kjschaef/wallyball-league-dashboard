
import { PerformanceTrend } from "@/components/PerformanceTrend";
import { GameHistory } from "@/components/GameHistory";
import { useQuery } from "@tanstack/react-query";
import { FloatingActionButton } from "@/components/FloatingActionButton";

export default function Overview() {
  const { data: matches } = useQuery<any[]>({
    queryKey: ["/api/matches"],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      <PerformanceTrend />
      <h2 className="text-2xl font-bold tracking-tight mt-8">Recent Matches</h2>
      <div>
        <GameHistory 
          games={matches?.slice(0, 5) || []}
          showViewAll={true}
        />
      </div>
      <FloatingActionButton
        onAddPlayer={() => setShowAddPlayer(true)}
        onRecordGame={() => setShowRecordGame(true)}
        onDailyWins={() => setShowDailyWins(true)}
      />
    </div>
  );
}
