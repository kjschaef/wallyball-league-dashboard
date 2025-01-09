import { GameHistory as GameHistoryComponent } from "@/components/GameHistory";
import { useQuery } from "@tanstack/react-query";

export default function GameHistory() {
  const { data: games, refetch } = useQuery<any[]>({
    queryKey: ["/api/games"],
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Game History</h1>
      <div>
        <GameHistoryComponent 
          games={games || []}
        />
      </div>
    </div>
  );
}