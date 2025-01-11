import { GameHistory as GameHistoryComponent } from "@/components/GameHistory";
import { useQuery } from "@tanstack/react-query";

export default function GameHistory() {
  const { data: games } = useQuery<any[]>({
    queryKey: ["/api/matches"],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Match History</h1>
      <div>
        <GameHistoryComponent 
          games={games || []}
        />
      </div>
    </div>
  );
}