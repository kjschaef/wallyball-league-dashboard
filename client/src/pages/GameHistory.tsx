import { GameHistory as GameHistoryComponent } from "@/components/GameHistory";
import { useQuery } from "@tanstack/react-query";

export default function GameHistory() {
  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  // Extract all games from players data
  const allGames = players?.reduce<Array<any>>((acc, player) => {
    const playerGames = player.games || [];
    return [...acc, ...playerGames];
  }, []) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Game History</h1>

      {/* Game History Section */}
      <div>
        <GameHistoryComponent 
          games={allGames}
          players={players || []}
        />
      </div>
    </div>
  );
}