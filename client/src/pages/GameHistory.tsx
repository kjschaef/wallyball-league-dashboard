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
          games={allGames?.map(game => ({
            ...game,
            teamOnePlayerOneId: game.teamOnePlayerOneId,
            teamOnePlayerTwoId: game.teamOnePlayerTwoId,
            teamOnePlayerThreeId: game.teamOnePlayerThreeId,
            teamTwoPlayerOneId: game.teamTwoPlayerOneId,
            teamTwoPlayerTwoId: game.teamTwoPlayerTwoId,
            teamTwoPlayerThreeId: game.teamTwoPlayerThreeId,
            teamOneGamesWon: game.teamOneGamesWon,
            teamTwoGamesWon: game.teamTwoGamesWon,
            date: game.date
          })) || []}
          players={players || []}
        />
      </div>
    </div>
  );
}