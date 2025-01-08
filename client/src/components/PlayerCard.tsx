import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import type { Player } from "@db/schema";

interface PlayerCardProps {
  player: Player & { matches: any[] };
  onEdit: (player: Player) => void;
  onDelete: (id: number) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const wins = player.matches?.reduce((acc, match) => acc + match.won, 0) || 0;
  const losses = player.matches?.reduce((acc, match) => acc + match.lost, 0) || 0;
  const total = wins + losses;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">
          {player.name}
          {player.number && <span className="ml-2 text-sm">#{player.number}</span>}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(player)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(player.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{winRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Wins</p>
            <p className="text-2xl font-bold text-green-600">{wins}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Losses</p>
            <p className="text-2xl font-bold text-red-600">{losses}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
