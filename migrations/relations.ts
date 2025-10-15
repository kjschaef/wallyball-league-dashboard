import { relations } from "drizzle-orm/relations";
import { players, playerAchievements, achievements, matches } from "./schema";

export const playerAchievementsRelations = relations(playerAchievements, ({one}) => ({
	player: one(players, {
		fields: [playerAchievements.playerId],
		references: [players.id]
	}),
	achievement: one(achievements, {
		fields: [playerAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const playersRelations = relations(players, ({many}) => ({
	playerAchievements: many(playerAchievements),
	matches_teamOnePlayerOneId: many(matches, {
		relationName: "matches_teamOnePlayerOneId_players_id"
	}),
	matches_teamOnePlayerTwoId: many(matches, {
		relationName: "matches_teamOnePlayerTwoId_players_id"
	}),
	matches_teamOnePlayerThreeId: many(matches, {
		relationName: "matches_teamOnePlayerThreeId_players_id"
	}),
	matches_teamTwoPlayerOneId: many(matches, {
		relationName: "matches_teamTwoPlayerOneId_players_id"
	}),
	matches_teamTwoPlayerTwoId: many(matches, {
		relationName: "matches_teamTwoPlayerTwoId_players_id"
	}),
	matches_teamTwoPlayerThreeId: many(matches, {
		relationName: "matches_teamTwoPlayerThreeId_players_id"
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	playerAchievements: many(playerAchievements),
}));

export const matchesRelations = relations(matches, ({one}) => ({
	player_teamOnePlayerOneId: one(players, {
		fields: [matches.teamOnePlayerOneId],
		references: [players.id],
		relationName: "matches_teamOnePlayerOneId_players_id"
	}),
	player_teamOnePlayerTwoId: one(players, {
		fields: [matches.teamOnePlayerTwoId],
		references: [players.id],
		relationName: "matches_teamOnePlayerTwoId_players_id"
	}),
	player_teamOnePlayerThreeId: one(players, {
		fields: [matches.teamOnePlayerThreeId],
		references: [players.id],
		relationName: "matches_teamOnePlayerThreeId_players_id"
	}),
	player_teamTwoPlayerOneId: one(players, {
		fields: [matches.teamTwoPlayerOneId],
		references: [players.id],
		relationName: "matches_teamTwoPlayerOneId_players_id"
	}),
	player_teamTwoPlayerTwoId: one(players, {
		fields: [matches.teamTwoPlayerTwoId],
		references: [players.id],
		relationName: "matches_teamTwoPlayerTwoId_players_id"
	}),
	player_teamTwoPlayerThreeId: one(players, {
		fields: [matches.teamTwoPlayerThreeId],
		references: [players.id],
		relationName: "matches_teamTwoPlayerThreeId_players_id"
	}),
}));
