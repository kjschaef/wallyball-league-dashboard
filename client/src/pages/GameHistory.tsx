import { GameHistory as GameHistoryComponent } from "@/components/GameHistory";
import { useQuery } from "@tanstack/react-query";

export default function GameHistory() {
  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Game History</h1>

      {/* Game History Section */}
      <div>
        <GameHistoryComponent 
          games={(() => {
            console.log("Players data:", players);
            const games = players?.reduce<Array<any>>((acc, player) => {
              const allGames = players?.map(p => {
                console.log("Processing player:", p.name, "games:", p.games);
                return p.games || [];
              }).flat();
              const uniqueGames = allGames.filter((game, index, self) =>
                index === self.findIndex((g) => g.id === game.id)
              );
              console.log("Unique games:", uniqueGames);
              return uniqueGames;
            }, []) || [];
            return games;
          })()}
          players={players || []}
        />
      </div>
    </div>
  );
}