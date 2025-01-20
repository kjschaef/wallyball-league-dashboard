import { useQuery } from "@tanstack/react-query";
import { Award, Trophy, Medal, Crown, Star, Users, Target } from "lucide-react";
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

export function PlayerAchievements({ playerId }: { playerId: number }) {
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: [`/api/achievements/${playerId}`],
  });

  if (!achievements) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Achievements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const Icon = ICON_MAP[achievement.icon] || Award;
          const isUnlocked = achievement.unlockedAt !== null;

          return (
            <Card
              key={achievement.id}
              className={`relative ${
                isUnlocked ? "bg-primary/5" : "bg-muted/50 opacity-75"
              }`}
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Icon
                    className={`h-5 w-5 ${
                      isUnlocked ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <CardTitle className="text-base">{achievement.name}</CardTitle>
                </div>
                <CardDescription>{achievement.description}</CardDescription>
              </CardHeader>
              {isUnlocked && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Unlocked on {format(new Date(achievement.unlockedAt!), "MMM d, yyyy")}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
