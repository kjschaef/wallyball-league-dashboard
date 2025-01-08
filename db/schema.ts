import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  playerOneId: integer("player_one_id").notNull().references(() => players.id),
  playerTwoId: integer("player_two_id").notNull().references(() => players.id),
  playerOneScore: integer("player_one_score").notNull(),
  playerTwoScore: integer("player_two_score").notNull(),
  date: timestamp("date").defaultNow(),
}, (table) => ({
  playerOneIdx: index("player_one_idx").on(table.playerOneId),
  playerTwoIdx: index("player_two_idx").on(table.playerTwoId),
}));

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;