
import { PerformanceTrend } from "@/components/PerformanceTrend";
import { GameHistory } from "@/components/GameHistory";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DailyWins } from "@/components/DailyWins";

export default function Overview() {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showRecordGame, setShowRecordGame] = useState(false);
  const [showDailyWins, setShowDailyWins] = useState(false);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const res = await fetch("http://0.0.0.0:5000/api/matches", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      <PerformanceTrend />
      <h2 className="text-2xl font-bold tracking-tight mt-8">Recent Matches</h2>
      <div>
        <GameHistory 
          games={matches.slice(0, 5)}
          showViewAll={true}
        />
      </div>

      <Dialog open={showDailyWins} onOpenChange={setShowDailyWins}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Daily Wins</DialogTitle>
          </DialogHeader>
          <DailyWins />
        </DialogContent>
      </Dialog>

      <FloatingActionButton
        onAddPlayer={() => setShowAddPlayer(true)}
        onRecordGame={() => setShowRecordGame(true)}
        onDailyWins={() => setShowDailyWins(true)}
      />
    </div>
  );
}
