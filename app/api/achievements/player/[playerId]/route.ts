import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "../../../../../db";
import { achievements, playerAchievements } from "../../../../../db/schema";

export async function GET(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const playerId = parseInt(params.playerId);

    const playerAchievementsData = await db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        unlockedAt: playerAchievements.unlockedAt
      })
      .from(achievements)
      .leftJoin(
        playerAchievements,
        and(
          eq(achievements.id, playerAchievements.achievementId),
          eq(playerAchievements.playerId, playerId)
        )
      );

    return NextResponse.json(playerAchievementsData);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}