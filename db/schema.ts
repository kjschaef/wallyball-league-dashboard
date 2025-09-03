import { pgTable, text, serial, integer, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startYear: integer("start_year"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  seasonStartDateIdx: index("season_start_date_idx").on(table.startDate),
  seasonActiveIdx: index("season_active_idx").on(table.isActive),
}));

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
  // Season reference
  seasonId: integer("season_id").references(() => seasons.id),
}, (table) => ({
  teamOnePlayerOneIdx: index("team_one_player_one_idx").on(table.teamOnePlayerOneId),
  teamOnePlayerTwoIdx: index("team_one_player_two_idx").on(table.teamOnePlayerTwoId),
  teamOnePlayerThreeIdx: index("team_one_player_three_idx").on(table.teamOnePlayerThreeId),
  teamTwoPlayerOneIdx: index("team_two_player_one_idx").on(table.teamTwoPlayerOneId),
  teamTwoPlayerTwoIdx: index("team_two_player_two_idx").on(table.teamTwoPlayerTwoId),
  teamTwoPlayerThreeIdx: index("team_two_player_three_idx").on(table.teamTwoPlayerThreeId),
  matchSeasonIdx: index("match_season_idx").on(table.seasonId),
  matchSeasonDateIdx: index("match_season_date_idx").on(table.seasonId, table.date),
}));

// New achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Achievement type (e.g., "games_played", "games_won")
  condition: text("condition").notNull(), // Achievement condition (e.g., "wins >= 10")
});

// Player achievements junction table
export const playerAchievements = pgTable("player_achievements", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
}, (table) => ({
  playerAchievementIdx: index("player_achievement_idx").on(table.playerId, table.achievementId),
}));

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertSeasonSchema = createInsertSchema(seasons);
export const selectSeasonSchema = createSelectSchema(seasons);
export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);
export const insertPlayerAchievementSchema = createInsertSchema(playerAchievements);
export const selectPlayerAchievementSchema = createSelectSchema(playerAchievements);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type PlayerAchievement = typeof playerAchievements.$inferSelect;
export type NewPlayerAchievement = typeof playerAchievements.$inferInsert;