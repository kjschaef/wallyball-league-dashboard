
import { useQuery } from "@tanstack/react-query";
import { Award, Trophy, Medal, Crown, Star, Users, Target } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";

const ICON_MAP = {
  Star: Star,
  Medal: Medal,
  Trophy: Trophy,
  Crown: Crown,
  Users: Users,
  Target: Target,
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
      {unlockedAchievements.map((achievement: any) => (
        <Tooltip key={achievement.id} delayDuration={50}>
          <TooltipTrigger asChild>
            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs cursor-help">
              {achievement.icon}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-sm">
            <p className="font-medium">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
