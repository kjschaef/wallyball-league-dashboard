import { pgTable, serial, text, integer, timestamp, index, foreignKey, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const players = pgTable("players", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	startYear: integer("start_year"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const playerAchievements = pgTable("player_achievements", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	achievementId: integer("achievement_id").notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => {
	return {
		playerAchievementIdx: index("player_achievement_idx").using("btree", table.playerId.asc().nullsLast(), table.achievementId.asc().nullsLast()),
		playerAchievementsPlayerIdFkey: foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "player_achievements_player_id_fkey"
		}),
		playerAchievementsAchievementIdFkey: foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievements.id],
			name: "player_achievements_achievement_id_fkey"
		}),
	}
});

export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	icon: text().notNull(),
	condition: text().notNull(),
});

export const matches = pgTable("matches", {
	id: serial().primaryKey().notNull(),
	teamOnePlayerOneId: integer("team_one_player_one_id"),
	teamOnePlayerTwoId: integer("team_one_player_two_id"),
	teamOnePlayerThreeId: integer("team_one_player_three_id"),
	teamTwoPlayerOneId: integer("team_two_player_one_id"),
	teamTwoPlayerTwoId: integer("team_two_player_two_id"),
	teamTwoPlayerThreeId: integer("team_two_player_three_id"),
	teamOneGamesWon: integer("team_one_games_won").notNull(),
	teamTwoGamesWon: integer("team_two_games_won").notNull(),
	date: timestamp({ mode: 'string' }).defaultNow(),
	seasonId: integer("season_id"),
}, (table) => {
	return {
		matchSeasonDateIdx: index("match_season_date_idx").using("btree", table.seasonId.asc().nullsLast(), table.date.asc().nullsLast()),
		matchSeasonIdx: index("match_season_idx").using("btree", table.seasonId.asc().nullsLast()),
		teamOnePlayerOneIdx: index("team_one_player_one_idx").using("btree", table.teamOnePlayerOneId.asc().nullsLast()),
		teamOnePlayerThreeIdx: index("team_one_player_three_idx").using("btree", table.teamOnePlayerThreeId.asc().nullsLast()),
		teamOnePlayerTwoIdx: index("team_one_player_two_idx").using("btree", table.teamOnePlayerTwoId.asc().nullsLast()),
		teamTwoPlayerOneIdx: index("team_two_player_one_idx").using("btree", table.teamTwoPlayerOneId.asc().nullsLast()),
		teamTwoPlayerThreeIdx: index("team_two_player_three_idx").using("btree", table.teamTwoPlayerThreeId.asc().nullsLast()),
		teamTwoPlayerTwoIdx: index("team_two_player_two_idx").using("btree", table.teamTwoPlayerTwoId.asc().nullsLast()),
		matchesTeamOnePlayerOneIdFkey: foreignKey({
			columns: [table.teamOnePlayerOneId],
			foreignColumns: [players.id],
			name: "matches_team_one_player_one_id_fkey"
		}),
		matchesTeamOnePlayerTwoIdFkey: foreignKey({
			columns: [table.teamOnePlayerTwoId],
			foreignColumns: [players.id],
			name: "matches_team_one_player_two_id_fkey"
		}),
		matchesTeamOnePlayerThreeIdFkey: foreignKey({
			columns: [table.teamOnePlayerThreeId],
			foreignColumns: [players.id],
			name: "matches_team_one_player_three_id_fkey"
		}),
		matchesTeamTwoPlayerOneIdFkey: foreignKey({
			columns: [table.teamTwoPlayerOneId],
			foreignColumns: [players.id],
			name: "matches_team_two_player_one_id_fkey"
		}),
		matchesTeamTwoPlayerTwoIdFkey: foreignKey({
			columns: [table.teamTwoPlayerTwoId],
			foreignColumns: [players.id],
			name: "matches_team_two_player_two_id_fkey"
		}),
		matchesTeamTwoPlayerThreeIdFkey: foreignKey({
			columns: [table.teamTwoPlayerThreeId],
			foreignColumns: [players.id],
			name: "matches_team_two_player_three_id_fkey"
		}),
		matchesSeasonIdFkey: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [seasons.id],
			name: "matches_season_id_fkey"
		}),
	}
});

export const seasons = pgTable("seasons", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		seasonActiveIdx: index("season_active_idx").using("btree", table.isActive.asc().nullsLast()),
		seasonStartDateIdx: index("season_start_date_idx").using("btree", table.startDate.asc().nullsLast()),
	}
});
