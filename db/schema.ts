import { relations } from "drizzle-orm";
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  team1Player1Id: integer("team1_player1_id").references(() => players.id),
  team1Player2Id: integer("team1_player2_id").references(() => players.id),
  team2Player1Id: integer("team2_player1_id").references(() => players.id),
  team2Player2Id: integer("team2_player2_id").references(() => players.id),
  team1Score: integer("team1_score").notNull(),
  team2Score: integer("team2_score").notNull(),
  date: timestamp("date").defaultNow(),
});

export const matchRelations = relations(matches, ({ one }) => ({
  team1Player1: one(players, {
    fields: [matches.team1Player1Id],
    references: [players.id],
  }),
  team1Player2: one(players, {
    fields: [matches.team1Player2Id],
    references: [players.id],
  }),
  team2Player1: one(players, {
    fields: [matches.team2Player1Id],
    references: [players.id],
  }),
  team2Player2: one(players, {
    fields: [matches.team2Player2Id],
    references: [players.id],
  }),
}));

export const playerRelations = relations(players, ({ many }) => ({
  team1Player1Matches: many(matches, { relationName: "team1Player1" }),
  team1Player2Matches: many(matches, { relationName: "team1Player2" }),
  team2Player1Matches: many(matches, { relationName: "team2Player1" }),
  team2Player2Matches: many(matches, { relationName: "team2Player2" }),
}));

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;