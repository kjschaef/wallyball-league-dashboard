import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startYear: integer("start_year"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
}, (table) => ({
  teamOnePlayerOneIdx: index("team_one_player_one_idx").on(table.teamOnePlayerOneId),
  teamOnePlayerTwoIdx: index("team_one_player_two_idx").on(table.teamOnePlayerTwoId),
  teamOnePlayerThreeIdx: index("team_one_player_three_idx").on(table.teamOnePlayerThreeId),
  teamTwoPlayerOneIdx: index("team_two_player_one_idx").on(table.teamTwoPlayerOneId),
  teamTwoPlayerTwoIdx: index("team_two_player_two_idx").on(table.teamTwoPlayerTwoId),
  teamTwoPlayerThreeIdx: index("team_two_player_three_idx").on(table.teamTwoPlayerThreeId),
}));

// Daily summaries cache
export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  summary: text("summary").notNull(),
  lastMatchId: integer("last_match_id"), // For cache invalidation
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("daily_summary_date_idx").on(table.date),
}));

// Site settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  adminPasswordHash: text("admin_password_hash"),
  signupOpenDayOfWeek: integer("signup_open_day_of_week").default(0), // 0 = Sunday
  signupOpenTime: text("signup_open_time").default("12:00"), // HH:mm
  signupCloseDayOfWeek: integer("signup_close_day_of_week").default(0), // 0 = Sunday
  signupCloseTime: text("signup_close_time").default("16:00"), // HH:mm
  availableDays: text("available_days").default(JSON.stringify(["Monday", "Tuesday", "Thursday"])),
});

// Weekly signups
export const weeklySignups = pgTable("weekly_signups", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull().default("registered"), // "registered" or "waitlisted"
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("weekly_signup_date_idx").on(table.date),
  playerDateIdx: index("weekly_signup_player_date_idx").on(table.playerId, table.date),
}));

export const weeklyUnavailable = pgTable("weekly_unavailable", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  weekStart: text("week_start").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  weekStartIdx: index("weekly_unavailable_week_start_idx").on(table.weekStart),
  playerWeekIdx: index("weekly_unavailable_player_week_idx").on(table.playerId, table.weekStart),
}));

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);

export const insertDailySummarySchema = createInsertSchema(dailySummaries);
export const selectDailySummarySchema = createSelectSchema(dailySummaries);

export const insertSiteSettingSchema = createInsertSchema(siteSettings);
export const selectSiteSettingSchema = createSelectSchema(siteSettings);

export const insertWeeklySignupSchema = createInsertSchema(weeklySignups);
export const selectWeeklySignupSchema = createSelectSchema(weeklySignups);
export const insertWeeklyUnavailableSchema = createInsertSchema(weeklyUnavailable);
export const selectWeeklyUnavailableSchema = createSelectSchema(weeklyUnavailable);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

export type DailySummary = typeof dailySummaries.$inferSelect;
export type NewDailySummary = typeof dailySummaries.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

export type WeeklySignup = typeof weeklySignups.$inferSelect;
export type NewWeeklySignup = typeof weeklySignups.$inferInsert;
export type WeeklyUnavailable = typeof weeklyUnavailable.$inferSelect;
export type NewWeeklyUnavailable = typeof weeklyUnavailable.$inferInsert;
