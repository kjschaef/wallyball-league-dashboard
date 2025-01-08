import { relations } from "drizzle-orm";
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  number: integer("number"),
  position: text("position"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  won: integer("won").notNull(),
  lost: integer("lost").notNull(),
  date: timestamp("date").defaultNow(),
});

export const playerRelations = relations(players, ({ many }) => ({
  matches: many(matches),
}));

export const matchRelations = relations(matches, ({ one }) => ({
  player: one(players, {
    fields: [matches.playerId],
    references: [players.id],
  }),
}));

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
