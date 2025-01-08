import { GameHistory as GameHistoryComponent } from "@/components/GameHistory";
import { PlayerCard } from "@/components/PlayerCard";
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

      {/* Players Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Players</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {players?.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={() => {}} // Read-only in game history
              onDelete={() => {}} // Read-only in game history
            />
          ))}
        </div>
      </div>

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