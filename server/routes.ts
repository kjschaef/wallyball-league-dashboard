import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq, or, and, gte, lte } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from "date-fns";
import { db } from "@db";
import { players, matches } from "@db/schema";

export function registerRoutes(app: Express): Server {
  // Players endpoints
  app.get("/api/players", async (_req, res) => {
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

        // Calculate player statistics
        const stats = playerMatches.reduce(
          (acc, match) => {
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

  // Add PUT endpoint for updating players
  app.put("/api/players/:id", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      console.log("Updating player:", playerId);

      // Only update the name field, excluding computed fields and timestamps
      const updatedPlayer = await db
        .update(players)
        .set({ name: req.body.name })
        .where(eq(players.id, playerId))
        .returning();

      if (updatedPlayer.length === 0) {
        return res.status(404).json({ error: "Player not found" });
      }

      console.log("Player updated:", updatedPlayer[0]);
      res.json(updatedPlayer[0]);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ error: "Failed to update player" });
    }
  });

  // Add DELETE endpoint for removing players
  app.delete("/api/players/:id", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      console.log("Deleting player:", playerId);

      // First, delete all games associated with this player
      await db.delete(matches).where(
        or(
          eq(matches.teamOnePlayerOneId, playerId),
          eq(matches.teamOnePlayerTwoId, playerId),
          eq(matches.teamOnePlayerThreeId, playerId),
          eq(matches.teamTwoPlayerOneId, playerId),
          eq(matches.teamTwoPlayerTwoId, playerId),
          eq(matches.teamTwoPlayerThreeId, playerId)
        )
      );

      // Then delete the player
      await db.delete(players).where(eq(players.id, playerId));

      console.log("Player and associated games deleted successfully");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ error: "Failed to delete player" });
    }
  });

  // Games endpoints
  app.get("/api/matches", async (_req, res) => {
    try {
      const allMatches = await db.select().from(matches);
      const allPlayers = await db.select().from(players);

      const matchesWithPlayerNames = allMatches.map((match) => ({
        ...match,
        teamOnePlayers: [
          match.teamOnePlayerOneId &&
            allPlayers.find((p) => p.id === match.teamOnePlayerOneId)?.name,
          match.teamOnePlayerTwoId &&
            allPlayers.find((p) => p.id === match.teamOnePlayerTwoId)?.name,
          match.teamOnePlayerThreeId &&
            allPlayers.find((p) => p.id === match.teamOnePlayerThreeId)?.name,
        ].filter(Boolean),
        teamTwoPlayers: [
          match.teamTwoPlayerOneId &&
            allPlayers.find((p) => p.id === match.teamTwoPlayerOneId)?.name,
          match.teamTwoPlayerTwoId &&
            allPlayers.find((p) => p.id === match.teamTwoPlayerTwoId)?.name,
          match.teamTwoPlayerThreeId &&
            allPlayers.find((p) => p.id === match.teamTwoPlayerThreeId)?.name,
        ].filter(Boolean),
      }));

      res.json(matchesWithPlayerNames);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      console.log("Recording new game:", req.body);
      const newGame = await db
        .insert(matches)
        .values({
          teamOnePlayerOneId: req.body.teamOnePlayerOneId,
          teamOnePlayerTwoId: req.body.teamOnePlayerTwoId,
          teamOnePlayerThreeId: req.body.teamOnePlayerThreeId,
          teamTwoPlayerOneId: req.body.teamTwoPlayerOneId,
          teamTwoPlayerTwoId: req.body.teamTwoPlayerTwoId,
          teamTwoPlayerThreeId: req.body.teamTwoPlayerThreeId,
          teamOneGamesWon: req.body.teamOneGamesWon,
          teamTwoGamesWon: req.body.teamTwoGamesWon,
          date: req.body.date ? new Date(req.body.date) : new Date(),
        })
        .returning();
      console.log("Game recorded:", newGame[0]);
      res.json(newGame[0]);
    } catch (error) {
      console.error("Error recording game:", error);
      res.status(500).json({ error: "Failed to record game" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      console.log("Deleting game:", gameId);

      await db.delete(matches).where(eq(matches.id, gameId));

      console.log("Game deleted successfully");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  // New endpoint for performance trends
  app.get("/api/trends", async (req, res) => {
    try {
      const { period = "weekly", playerId } = req.query;
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
          const periodGames = await db
            .select()
            .from(games)
            .where(
              and(
                gte(games.date, start),
                lte(games.date, end),
                playerId ? 
                  or(
                    eq(games.teamOnePlayerOneId, Number(playerId)),
                    eq(games.teamOnePlayerTwoId, Number(playerId)),
                    eq(games.teamOnePlayerThreeId, Number(playerId)),
                    eq(games.teamTwoPlayerOneId, Number(playerId)),
                    eq(games.teamTwoPlayerTwoId, Number(playerId)),
                    eq(games.teamTwoPlayerThreeId, Number(playerId))
                  )
                : undefined
              )
            );

          // Calculate performance metrics
          const stats = periodGames.reduce(
            (acc, game) => {
              if (playerId) {
                const isTeamOne =
                  game.teamOnePlayerOneId === Number(playerId) ||
                  game.teamOnePlayerTwoId === Number(playerId) ||
                  game.teamOnePlayerThreeId === Number(playerId);

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

      res.json(trendsData.reverse()); // Most recent first
    } catch (error) {
      console.error("Error fetching performance trends:", error);
      res.status(500).json({ error: "Failed to fetch performance trends" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}