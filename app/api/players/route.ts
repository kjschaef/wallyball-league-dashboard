import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { players, matches } from "../../../db/schema";

export async function GET() {
  try {
    console.log("Fetching all players");
    const allPlayers = await db.select().from(players);
    console.log("Successfully fetched players:", allPlayers);

    const allMatches = await db.select().from(matches);
    console.log("Successfully fetched matches:", allMatches);

    const playersWithStats = allPlayers.map((player) => {
      // Filter matches where the player participated
      const playerMatches = allMatches.filter(
        (match) =>
          match.teamOnePlayerOneId === player.id ||
          match.teamOnePlayerTwoId === player.id ||
          match.teamOnePlayerThreeId === player.id ||
          match.teamTwoPlayerOneId === player.id ||
          match.teamTwoPlayerTwoId === player.id ||
          match.teamTwoPlayerThreeId === player.id,
      );

      // Group matches by date
      const matchesByDate = playerMatches.reduce((acc, match) => {
        const date = new Date(match.date).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
      }, {});

      // Calculate stats per day (90 min session)
      const stats = Object.values(matchesByDate).reduce(
        (acc, dayMatches) => {
          const totalGamesInDay = dayMatches.reduce((sum, match) => {
            return sum + match.teamOneGamesWon + match.teamTwoGamesWon;
          }, 0);

          let dayWins = 0;
          let dayLosses = 0;

          dayMatches.forEach(match => {
            const isTeamOne =
              match.teamOnePlayerOneId === player.id ||
              match.teamOnePlayerTwoId === player.id ||
              match.teamOnePlayerThreeId === player.id;

            dayWins += isTeamOne ? match.teamOneGamesWon : match.teamTwoGamesWon;
            dayLosses += isTeamOne ? match.teamTwoGamesWon : match.teamOneGamesWon;
          });

          return {
            won: acc.won + dayWins,
            lost: acc.lost + dayLosses,
            totalMatchTime: acc.totalMatchTime + 90, // 90 minutes per daily session
            totalGames: acc.totalGames + totalGamesInDay,
          };
        },
        { won: 0, lost: 0, totalMatchTime: 0, totalGames: 0 }
      );

      // Convert total time to hours
      stats.totalMatchTime = Math.round(stats.totalMatchTime / 60);

      // Add matches with win/loss info to player data
      const processedMatches = playerMatches.map((match) => {
        const isTeamOne =
          match.teamOnePlayerOneId === player.id ||
          match.teamOnePlayerTwoId === player.id ||
          match.teamOnePlayerThreeId === player.id;

        return {
          id: match.id,
          date: match.date,
          teamOneGamesWon: match.teamOneGamesWon,
          teamTwoGamesWon: match.teamTwoGamesWon,
          isTeamOne,
          won: isTeamOne
            ? match.teamOneGamesWon > match.teamTwoGamesWon
            : match.teamTwoGamesWon > match.teamOneGamesWon,
        };
      });

      return {
        ...player,
        matches: processedMatches,
        stats,
      };
    });

    console.log("Processed player statistics:", playersWithStats);
    return NextResponse.json(playersWithStats);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Creating new player:", data);
    
    const playerData = {
      ...data,
      startYear: new Date().getFullYear()
    };
    
    const newPlayer = await db.insert(players).values(playerData).returning();
    console.log("Player created:", newPlayer[0]);
    
    return NextResponse.json(newPlayer[0]);
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  }
}