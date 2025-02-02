import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

const ICON_MAP: { [key: string]: string } = {
  "games_played": "🏅",
  "games_won": "🏆",
  "win_rate": "⭐",
  "perfect_games": "🎯",
  "unique_teammates": "👥",
  "default": "🥇",
};

export function PlayerAchievements({ playerId, compact = false }: { playerId: number; compact?: boolean }) {
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: [`/api/achievements/${playerId}`],
  });

  if (!achievements) return null;

  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);

  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {unlockedAchievements.map((achievement) => {
          return (
            <Tooltip key={achievement.id} delayDuration={50}>
              <TooltipTrigger asChild>
                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs cursor-help">
                  {console.log('Achievement icon:', achievement.icon) || ICON_MAP[achievement.icon] || ICON_MAP.default}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                <p className="font-medium">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}