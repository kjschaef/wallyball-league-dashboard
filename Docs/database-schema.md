# Database Schema

## Overview

The Volleyball League Management Platform uses PostgreSQL as its database, with Drizzle ORM providing a type-safe interface for database operations. This document outlines the database schema, including tables, relationships, and key fields.

## Tables

### Players Table

The `players` table stores information about individual players.

```typescript
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startYear: integer("start_year"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Fields:**
- `id`: Unique identifier for the player (Primary Key)
- `name`: The player's name (Required)
- `startYear`: The year the player started playing (Optional)
- `createdAt`: Timestamp when the player was added to the system

### Matches Table

The `matches` table records volleyball matches between two teams.

```typescript
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  // Team One Players
  teamOnePlayerOneId: integer("team_one_player_one_id").references(() => players.id),
  teamOnePlayerTwoId: integer("team_one_player_two_id").references(() => players.id),
  teamOnePlayerThreeId: integer("team_one_player_three_id").references(() => players.id),
  // Team Two Players
  teamTwoPlayerOneId: integer("team_two_player_one_id").references(() => players.id),
  teamTwoPlayerTwoId: integer("team_two_player_two_id").references(() => players.id),
  teamTwoPlayerThreeId: integer("team_two_player_three_id").references(() => players.id),
  // Scores
  teamOneGamesWon: integer("team_one_games_won").notNull(),
  teamTwoGamesWon: integer("team_two_games_won").notNull(),
  date: timestamp("date").defaultNow(),
});
```

**Fields:**
- `id`: Unique identifier for the match (Primary Key)
- Team One Players (Foreign Keys to players.id):
  - `teamOnePlayerOneId`: First player on Team One
  - `teamOnePlayerTwoId`: Second player on Team One (Optional)
  - `teamOnePlayerThreeId`: Third player on Team One (Optional)
- Team Two Players (Foreign Keys to players.id):
  - `teamTwoPlayerOneId`: First player on Team Two
  - `teamTwoPlayerTwoId`: Second player on Team Two (Optional)
  - `teamTwoPlayerThreeId`: Third player on Team Two (Optional)
- `teamOneGamesWon`: Number of games won by Team One
- `teamTwoGamesWon`: Number of games won by Team Two
- `date`: Date and time when the match was played

**Indexes:**
- Indexes are created on all player ID fields to optimize queries

### Achievements Table

The `achievements` table defines possible achievements that players can earn.

```typescript
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  condition: text("condition").notNull(),
});
```

**Fields:**
- `id`: Unique identifier for the achievement (Primary Key)
- `name`: Name of the achievement
- `description`: Detailed description of the achievement
- `icon`: Icon identifier for visual representation
- `condition`: Criteria for unlocking the achievement

### Player Achievements Table

The `playerAchievements` junction table records which players have earned which achievements.

```typescript
export const playerAchievements = pgTable("player_achievements", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});
```

**Fields:**
- `id`: Unique identifier (Primary Key)
- `playerId`: Reference to the player who earned the achievement (Foreign Key)
- `achievementId`: Reference to the earned achievement (Foreign Key)
- `unlockedAt`: Timestamp when the achievement was unlocked

**Indexes:**
- Composite index on `playerId` and `achievementId` to optimize queries

## Relationships

- **Players to Matches**: One-to-many relationship where a player can participate in multiple matches
- **Players to Achievements**: Many-to-many relationship through the playerAchievements junction table

## Type Definitions

The schema exports type definitions for use in TypeScript code:

```typescript
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type PlayerAchievement = typeof playerAchievements.$inferSelect;
export type NewPlayerAchievement = typeof playerAchievements.$inferInsert;
```

## Schema Validation

Zod schemas are generated from the Drizzle tables for validation:

```typescript
export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);
export const insertPlayerAchievementSchema = createInsertSchema(playerAchievements);
export const selectPlayerAchievementSchema = createSelectSchema(playerAchievements);
```

These schemas ensure that data conforms to the expected structure before database operations.