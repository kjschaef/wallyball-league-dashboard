// Mock of the schema with just the structure needed for testing
import { pgTable, serial, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  startYear: integer('start_year').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  teamOnePlayerOneId: integer('team_one_player_one_id').references(() => players.id).notNull(),
  teamOnePlayerTwoId: integer('team_one_player_two_id').references(() => players.id),
  teamTwoPlayerOneId: integer('team_two_player_one_id').references(() => players.id).notNull(),
  teamTwoPlayerTwoId: integer('team_two_player_two_id').references(() => players.id),
  teamOneGamesWon: integer('team_one_games_won').notNull(),
  teamTwoGamesWon: integer('team_two_games_won').notNull(),
  date: timestamp('date').defaultNow().notNull()
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull()
});

export const playerAchievements = pgTable('player_achievements', {
  playerId: integer('player_id').references(() => players.id).notNull(),
  achievementId: integer('achievement_id').references(() => achievements.id).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.playerId, table.achievementId)
  };
});

// Mock the schema types 
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type PlayerAchievement = typeof playerAchievements.$inferSelect;
export type NewPlayerAchievement = typeof playerAchievements.$inferInsert;