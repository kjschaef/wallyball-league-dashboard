
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Medal, Star, Trophy, Target, Users, Award } from "lucide-react";

const ICON_MAP = {
  medal: Medal,
  star: Star,
  trophy: Trophy,
  target: Target,
  users: Users,
  award: Award,
};

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: keyof typeof ICON_MAP;
  unlockedAt: string | null;
}

export function PlayerAchievements({ playerId, compact = false }: { playerId: number; compact?: boolean }) {
  const { data: achievements } = useQuery({
    queryKey: [`/api/achievements/${playerId}`],
  });

  if (!achievements) return null;

  const unlockedAchievements = achievements.filter((a: any) => a.unlockedAt);

  return (
    <TooltipProvider>
      {unlockedAchievements.map((achievement: Achievement) => {
        const IconComponent = ICON_MAP[achievement.icon];
        return (
          <Tooltip key={achievement.id} delayDuration={50}>
            <TooltipTrigger asChild>
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs cursor-help">
                <IconComponent className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-sm">
              <p className="font-medium">{achievement.name}</p>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </TooltipProvider>
  );
}
