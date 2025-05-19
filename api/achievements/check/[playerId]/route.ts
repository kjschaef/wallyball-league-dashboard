import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "../../../../../db";
import { matches, achievements, playerAchievements } from "../../../../../db/schema";

export async function POST(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const playerId = parseInt(params.playerId);

    // Get player's matches and current achievements
    const playerGames = await db.select().from(matches).where(
      or(
        eq(matches.teamOnePlayerOneId, playerId),
        eq(matches.teamOnePlayerTwoId, playerId),
        eq(matches.teamOnePlayerThreeId, playerId),
        eq(matches.teamTwoPlayerOneId, playerId),
        eq(matches.teamTwoPlayerTwoId, playerId),
        eq(matches.teamTwoPlayerThreeId, playerId)
      )
    );

    const playerStats = playerGames.reduce((acc, game) => {
      const isTeamOne = [
        game.teamOnePlayerOneId,
        game.teamOnePlayerTwoId,
        game.teamOnePlayerThreeId
      ].includes(playerId);

      const gamesWon = isTeamOne ? game.teamOneGamesWon : game.teamTwoGamesWon;
      const gamesLost = isTeamOne ? game.teamTwoGamesWon : game.teamOneGamesWon;

      // Collect unique teammates
      const teammates = new Set();
      if (isTeamOne) {
        [game.teamOnePlayerOneId, game.teamOnePlayerTwoId, game.teamOnePlayerThreeId]
          .filter(id => id !== null && id !== playerId)
          .forEach(id => teammates.add(id));
      } else {
        [game.teamTwoPlayerOneId, game.teamTwoPlayerTwoId, game.teamTwoPlayerThreeId]
          .filter(id => id !== null && id !== playerId)
          .forEach(id => teammates.add(id));
      }

      return {
        gamesPlayed: acc.gamesPlayed + 1,
        gamesWon: acc.gamesWon + gamesWon,
        gamesLost: acc.gamesLost + gamesLost,
        perfectGames: acc.perfectGames + (gamesWon > 0 && gamesLost === 0 ? 1 : 0),
        uniqueTeammates: new Set([...acc.uniqueTeammates, ...teammates])
      };
    }, {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      perfectGames: 0,
      uniqueTeammates: new Set()
    });

    const winRate = playerStats.gamesWon / (playerStats.gamesWon + playerStats.gamesLost);

    // Get all achievements and check which ones the player qualifies for
    const allAchievements = await db.select().from(achievements);
    const playerAchievementsData = await db.select()
      .from(playerAchievements)
      .where(eq(playerAchievements.playerId, playerId));

    const unlockedAchievementIds = new Set(
      playerAchievementsData.map(pa => pa.achievementId)
    );

    const newAchievements = allAchievements.filter(achievement => {
      if (unlockedAchievementIds.has(achievement.id)) return false;

      // Check conditions
      switch (achievement.condition) {
        case 'games_played >= 1':
          return playerStats.gamesPlayed >= 1;
        case 'games_played >= 10':
          return playerStats.gamesPlayed >= 10;
        case 'games_won >= 5':
          return playerStats.gamesWon >= 5;
        case 'win_rate >= 0.7':
          return winRate >= 0.7;
        case 'unique_teammates >= 5':
          return playerStats.uniqueTeammates.size >= 5;
        case 'perfect_games >= 1':
          return playerStats.perfectGames >= 1;
        default:
          return false;
      }
    });

    // Award new achievements
    if (newAchievements.length > 0) {
      await Promise.all(
        newAchievements.map(achievement =>
          db.insert(playerAchievements).values({
            playerId,
            achievementId: achievement.id,
            unlockedAt: new Date(),
          })
        )
      );
    }

    return NextResponse.json({ 
      newAchievements,
      playerStats: {
        ...playerStats,
        uniqueTeammates: playerStats.uniqueTeammates.size
      }
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    return NextResponse.json(
      { error: "Failed to check achievements" },
      { status: 500 }
    );
  }
}