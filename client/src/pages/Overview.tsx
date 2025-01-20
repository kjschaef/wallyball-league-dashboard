
import { PerformanceTrend } from "@/components/PerformanceTrend";
import { GameHistory } from "@/components/GameHistory";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FloatingActionButton } from "@/components/FloatingActionButton";

export default function Overview() {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showRecordGame, setShowRecordGame] = useState(false);
  const [showDailyWins, setShowDailyWins] = useState(false);

  const { data: matches, isLoading } = useQuery<any[]>({
    queryKey: ["/api/matches"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
