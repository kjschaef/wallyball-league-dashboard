import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  team1Player1Id: integer("team1_player1_id").notNull().references(() => players.id),
  team1Player2Id: integer("team1_player2_id").notNull().references(() => players.id),
  team2Player1Id: integer("team2_player1_id").notNull().references(() => players.id),
  team2Player2Id: integer("team2_player2_id").notNull().references(() => players.id),
  team1Score: integer("team1_score").notNull(),
  team2Score: integer("team2_score").notNull(),
  date: timestamp("date").defaultNow(),
}, (table) => ({
  team1Player1Idx: index("team1_player1_idx").on(table.team1Player1Id),
  team1Player2Idx: index("team1_player2_idx").on(table.team1Player2Id),
  team2Player1Idx: index("team2_player1_idx").on(table.team2Player1Id),
  team2Player2Idx: index("team2_player2_idx").on(table.team2Player2Id),
}));

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;