import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
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

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;