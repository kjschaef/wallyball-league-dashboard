
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
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

    let trendsData = [];
    if (period === "weekly") {
      const weekStart = startOfWeek(subWeeks(currentDate, 4));
      const weekEnd = endOfWeek(currentDate);
      
      if (playerId) {
        const results = await db.execute(sql`
          SELECT 
            date_trunc('week', date) as period,
            COUNT(*) as total_games,
            SUM(CASE 
              WHEN (team_one_player_one_id = ${playerId} OR 
                   team_one_player_two_id = ${playerId} OR 
                   team_one_player_three_id = ${playerId}) AND team_one_games_won > team_two_games_won THEN 1
              WHEN (team_two_player_one_id = ${playerId} OR 
                   team_two_player_two_id = ${playerId} OR 
                   team_two_player_three_id = ${playerId}) AND team_two_games_won > team_one_games_won THEN 1
              ELSE 0
            END) as games_won
          FROM matches
          WHERE date >= ${weekStart} AND date <= ${weekEnd}
          AND (
            team_one_player_one_id = ${playerId} OR 
            team_one_player_two_id = ${playerId} OR 
            team_one_player_three_id = ${playerId} OR
            team_two_player_one_id = ${playerId} OR 
            team_two_player_two_id = ${playerId} OR 
            team_two_player_three_id = ${playerId}
          )
          GROUP BY period
          ORDER BY period DESC
        `);
        
        trendsData = results.map(row => ({
          date: row.period,
          winRate: row.total_games > 0 ? (row.games_won / row.total_games) * 100 : 0
        }));
      } else {
        const results = await db.execute(sql`
          SELECT 
            date_trunc('week', date) as period,
            COUNT(*) as total_games,
            SUM(CASE WHEN team_one_games_won > team_two_games_won THEN 1 ELSE 0 END) as games_won
          FROM matches
          WHERE date >= ${weekStart} AND date <= ${weekEnd}
          GROUP BY period
          ORDER BY period DESC
        `);
        
        trendsData = results.map(row => ({
          date: row.period,
          winRate: row.total_games > 0 ? (row.games_won / row.total_games) * 100 : 0
        }));
      }
    } else {
      // Monthly data
      const monthStart = startOfMonth(subMonths(currentDate, 3));
      const monthEnd = endOfMonth(currentDate);
      
      if (playerId) {
        const results = await db.execute(sql`
          SELECT 
            date_trunc('month', date) as period,
            COUNT(*) as total_games,
            SUM(CASE 
              WHEN (team_one_player_one_id = ${playerId} OR 
                   team_one_player_two_id = ${playerId} OR 
                   team_one_player_three_id = ${playerId}) AND team_one_games_won > team_two_games_won THEN 1
              WHEN (team_two_player_one_id = ${playerId} OR 
                   team_two_player_two_id = ${playerId} OR 
                   team_two_player_three_id = ${playerId}) AND team_two_games_won > team_one_games_won THEN 1
              ELSE 0
            END) as games_won
          FROM matches
          WHERE date >= ${monthStart} AND date <= ${monthEnd}
          AND (
            team_one_player_one_id = ${playerId} OR 
            team_one_player_two_id = ${playerId} OR 
            team_one_player_three_id = ${playerId} OR
            team_two_player_one_id = ${playerId} OR 
            team_two_player_two_id = ${playerId} OR 
            team_two_player_three_id = ${playerId}
          )
          GROUP BY period
          ORDER BY period DESC
        `);
        
        trendsData = results.map(row => ({
          date: row.period,
          winRate: row.total_games > 0 ? (row.games_won / row.total_games) * 100 : 0
        }));
      } else {
        const results = await db.execute(sql`
          SELECT 
            date_trunc('month', date) as period,
            COUNT(*) as total_games,
            SUM(CASE WHEN team_one_games_won > team_two_games_won THEN 1 ELSE 0 END) as games_won
          FROM matches
          WHERE date >= ${monthStart} AND date <= ${monthEnd}
          GROUP BY period
          ORDER BY period DESC
        `);
        
        trendsData = results.map(row => ({
          date: row.period,
          winRate: row.total_games > 0 ? (row.games_won / row.total_games) * 100 : 0
        }));
      }
    }

    return NextResponse.json(trendsData);
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance trends" },
      { status: 500 }
    );
  }
}
