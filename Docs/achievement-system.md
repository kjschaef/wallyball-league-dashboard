# Achievement System

## Overview

The Achievement System is a gamification feature that recognizes player accomplishments through badges and visual indicators. It tracks player milestones and automatically awards achievements based on performance metrics and participation patterns.

## Achievement Types

The platform includes the following achievement types:

| Icon | Name | Description | Criteria |
|------|------|-------------|----------|
| 🏐 | First Game Played | Participated in first volleyball match | Play 1 game |
| 🏆 | Won 5 Games | Reached 5 game victories | Win 5 games |
| 🗓️ | Played 10 Games | Participated in 10 games | Play in 10 games |
| 🎯 | 70% Win Rate | Achieved 70% or higher win percentage | Maintain 70%+ win rate with minimum games |
| 👥 | Team Player | Played with 5 different teammates | Play with 5+ unique teammates |
| 👑 | Perfect Game | Won a game without losing a point | Win a perfect game |

## Technical Implementation

### Data Model

The achievement system uses two database tables:

1. **Achievements Table**
```typescript
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  condition: text("condition").notNull(),
});
```

2. **Player Achievements Junction Table**
```typescript
export const playerAchievements = pgTable("player_achievements", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});
```

### Achievement Processing

Achievements are processed through the following flow:

1. When a match is recorded, player statistics are updated
2. The backend checks if any players have met achievement criteria
3. If criteria are met, new records are added to the playerAchievements table
4. The frontend displays the newly unlocked achievements

### Achievement Component

The `PlayerAchievements` component displays earned achievements for a specific player:

```typescript
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
                <div 
                  className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs cursor-help"
                >
                  {ICON_MAP[achievement.icon] || ICON_MAP.default}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm touch-auto">
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
```

### Icon Mapping

Achievement icons are mapped to emoji symbols:

```typescript
const ICON_MAP: { [key: string]: string } = {
  "Medal": "🏐",
  "Trophy": "🏆",
  "Star": "🗓️",
  "Target": "🎯",
  "Users": "👥",
  "Crown": "👑",
  "default": "🥇",
};
```

## API Endpoints

The achievement system exposes the following API endpoint:

- `GET /api/achievements/:playerId` - Retrieves all achievements for a specific player, indicating which ones have been unlocked

## User Interface

Achievements are displayed in various locations throughout the application:

1. **Player Cards**
   - Row of achievement badges
   - Tooltips with achievement details on hover/tap

2. **Results Page**
   - Achievement legend explaining all possible badges
   - Visual indicators of player progress

3. **Achievement Unlocking**
   - Visual feedback when new achievements are unlocked
   - Toast notifications for significant achievements

## Achievement Criteria Evaluation

Achievement criteria are evaluated using the following logic:

1. **First Game Played**
   - Triggered on the player's first match participation

2. **Won 5 Games**
   - Cumulative wins across all matches are tracked
   - Achievement unlocks when total wins reaches 5

3. **Played 10 Games**
   - Total game participation is counted
   - Achievement unlocks at 10 games

4. **70% Win Rate**
   - Win percentage is calculated as (wins / total games)
   - Achievement requires a minimum number of games played
   - Applies inactivity penalties before evaluation

5. **Team Player**
   - Unique teammates are tracked across all matches
   - Achievement unlocks after playing with 5 different players

6. **Perfect Game**
   - Requires winning a game with a perfect score
   - Special achievement for exceptional performance

## Best Practices

1. **User Experience**
   - Keep achievement displays compact but informative
   - Provide clear visual feedback for newly unlocked achievements
   - Make achievement tooltips accessible on both desktop and mobile

2. **Performance**
   - Efficiently query achievements to minimize database load
   - Cache achievement data where appropriate
   - Optimize achievement checking to run only when relevant stats change

3. **Extensibility**
   - Design the achievement system to easily add new achievement types
   - Use a consistent format for achievement criteria
   - Maintain clear documentation of achievement logic