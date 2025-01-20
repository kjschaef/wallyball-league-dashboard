
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Statistics() {
  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  if (!players) return null;

  const sortedPlayers = [...players].sort((a, b) => {
    const aWinRate = a.stats.won / (a.stats.won + a.stats.lost) || 0;
    const bWinRate = b.stats.won / (b.stats.won + b.stats.lost) || 0;
    return bWinRate - aWinRate;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Player Statistics</h1>
      
      <div className="grid gap-6">
        {sortedPlayers.map(player => {
          const totalGames = player.stats.won + player.stats.lost;
          const winRate = totalGames > 0 ? (player.stats.won / totalGames) * 100 : 0;
          const uniqueDays = new Set(player.matches.map((m: any) => 
            new Date(m.date).toLocaleDateString()
          )).size;
          const winsPerDay = uniqueDays > 0 ? player.stats.won / uniqueDays : 0;

          return (
            <Card key={player.id}>
              <CardHeader>
                <CardTitle>{player.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Win Rate</span>
                    <span>{winRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={winRate} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Games</p>
                    <p className="text-2xl font-bold">{totalGames}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days Played</p>
                    <p className="text-2xl font-bold">{uniqueDays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Wins</p>
                    <p className="text-2xl font-bold">{player.stats.won}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Wins/Day</p>
                    <p className="text-2xl font-bold">{winsPerDay.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
