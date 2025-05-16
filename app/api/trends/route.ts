import { NextResponse } from "next/server";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from "date-fns";
import { db } from "../../../db";
import { matches } from "../../../db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "weekly";
    const playerIdParam = searchParams.get("playerId");
    const playerId = playerIdParam ? parseInt(playerIdParam) : undefined;
    
    const currentDate = new Date();

    // Calculate date ranges based on period
    let periods = [];
    if (period === "weekly") {
      // Get last 4 weeks
      for (let i = 0; i < 4; i++) {
        const weekStart = startOfWeek(subWeeks(currentDate, i));
        const weekEnd = endOfWeek(subWeeks(currentDate, i));
        periods.push({ start: weekStart, end: weekEnd });
      }
    } else {
      // Get last 3 months
      for (let i = 0; i < 3; i++) {
        const monthStart = startOfMonth(subMonths(currentDate, i));
        const monthEnd = endOfMonth(subMonths(currentDate, i));
        periods.push({ start: monthStart, end: monthEnd });
      }
    }

    // Get performance data for each period
    const trendsData = await Promise.all(
      periods.map(async ({ start, end }) => {
        const whereConditions = [
          gte(matches.date, start),
          lte(matches.date, end),
        ];

        // Add player filter if specified
        if (playerId) {
          whereConditions.push(
            or(
              eq(matches.teamOnePlayerOneId, playerId),
              eq(matches.teamOnePlayerTwoId, playerId),
              eq(matches.teamOnePlayerThreeId, playerId),
              eq(matches.teamTwoPlayerOneId, playerId),
              eq(matches.teamTwoPlayerTwoId, playerId),
              eq(matches.teamTwoPlayerThreeId, playerId)
            )
          );
        }

        const periodGames = await db
          .select()
          .from(matches)
          .where(and(...whereConditions));

        // Calculate performance metrics
        const stats = periodGames.reduce(
          (acc, game) => {
            if (playerId) {
              const isTeamOne =
                game.teamOnePlayerOneId === playerId ||
                game.teamOnePlayerTwoId === playerId ||
                game.teamOnePlayerThreeId === playerId;

              const gamesWon = isTeamOne ? game.teamOneGamesWon : game.teamTwoGamesWon;
              const gamesLost = isTeamOne ? game.teamTwoGamesWon : game.teamOneGamesWon;

              return {
                gamesWon: acc.gamesWon + gamesWon,
                gamesLost: acc.gamesLost + gamesLost,
                totalGames: acc.totalGames + 1,
              };
            }

            // Team-wide stats if no player specified
            return {
              gamesWon: acc.gamesWon + game.teamOneGamesWon + game.teamTwoGamesWon,
              gamesLost: acc.gamesLost + game.teamTwoGamesWon + game.teamOneGamesWon,
              totalGames: acc.totalGames + 1,
            };
          },
          { gamesWon: 0, gamesLost: 0, totalGames: 0 }
        );

        return {
          period: start.toISOString(),
          ...stats,
          winRate: stats.totalGames > 0 ? (stats.gamesWon / (stats.gamesWon + stats.gamesLost)) * 100 : 0,
        };
      })
    );

    return NextResponse.json(trendsData.reverse()); // Most recent first
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance trends" },
      { status: 500 }
    );
  }
}