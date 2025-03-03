/**
 * Mock routes file for testing that avoids using aliased imports
 * This simulates the structure of server/routes.ts but uses our test db
 */
import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq, or, and, gte, lte } from "drizzle-orm";
import { db } from "./setup.js";
import { players, matches, achievements, playerAchievements, type Player, type Match } from "../../db/schema.js";

// Define types for our statistics
interface PlayerStats {
  won: number;
  lost: number;
}

interface ProcessedMatch {
  id: number;
  date: string;
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
  isTeamOne: boolean;
  won: boolean;
}

// Mock routes file that mimics the real routes but uses our test db
export function registerRoutes(app: Express): Server {
  // Players endpoints
  app.get("/api/players", async (_req, res) => {
    try {
      console.log("Fetching all players");
      const allPlayers = await db.select().from(players);
      console.log("Successfully fetched players:", allPlayers);

      const allMatches = await db.select().from(matches);
      console.log("Successfully fetched matches:", allMatches);

      const playersWithStats = allPlayers.map((player: Player) => {
        // Filter matches where the player participated
        const playerMatches = allMatches.filter(
          (match: Match) =>
            match.teamOnePlayerOneId === player.id ||
            match.teamOnePlayerTwoId === player.id ||
            match.teamOnePlayerThreeId === player.id ||
            match.teamTwoPlayerOneId === player.id ||
            match.teamTwoPlayerTwoId === player.id ||
            match.teamTwoPlayerThreeId === player.id,
        );

        // Calculate player statistics
        const stats = playerMatches.reduce(
          (acc: PlayerStats, match: Match) => {
            // Determine which team the player was on
            const isTeamOne =
              match.teamOnePlayerOneId === player.id ||
              match.teamOnePlayerTwoId === player.id ||
              match.teamOnePlayerThreeId === player.id;

            // Sum up individual games won and lost
            const gamesWon = isTeamOne
              ? match.teamOneGamesWon
              : match.teamTwoGamesWon;
            const gamesLost = isTeamOne
              ? match.teamTwoGamesWon
              : match.teamOneGamesWon;

            return {
              won: acc.won + gamesWon,
              lost: acc.lost + gamesLost,
            };
          },
          { won: 0, lost: 0 },
        );

        // Add matches with win/loss info to player data
        const processedMatches = playerMatches.map((match: Match) => {
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
      res.json(playersWithStats);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      console.log("Creating new player:", req.body);
      const newPlayer = await db.insert(players).values(req.body).returning();
      console.log("Player created:", newPlayer[0]);
      res.json(newPlayer[0]);
    } catch (error) {
      console.error("Error creating player:", error);
      res.status(500).json({ error: "Failed to create player" });
    }
  });

  // Create the HTTP server
  const server = createServer(app);
  return server;
}