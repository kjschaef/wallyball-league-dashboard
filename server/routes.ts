import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { players, games } from "@db/schema";

export function registerRoutes(app: Express): Server {
  // Players endpoints
  app.get("/api/players", async (_req, res) => {
    try {
      console.log("Fetching all players");
      const allPlayers = await db.select().from(players);
      console.log("Successfully fetched players:", allPlayers);

      const allGames = await db.select().from(games);
      console.log("Successfully fetched games:", allGames);

      const playersWithStats = allPlayers.map((player) => {
        // Filter games where the player participated
        const playerGames = allGames.filter(
          (game) =>
            game.teamOnePlayerOneId === player.id ||
            game.teamOnePlayerTwoId === player.id ||
            game.teamOnePlayerThreeId === player.id ||
            game.teamTwoPlayerOneId === player.id ||
            game.teamTwoPlayerTwoId === player.id ||
            game.teamTwoPlayerThreeId === player.id,
        );

        // Calculate player statistics
        const stats = playerGames.reduce(
          (acc, game) => {
            // Determine which team the player was on
            const isTeamOne =
              game.teamOnePlayerOneId === player.id ||
              game.teamOnePlayerTwoId === player.id ||
              game.teamOnePlayerThreeId === player.id;

            // Sum up individual games won and lost
            const gamesWon = isTeamOne
              ? game.teamOneGamesWon
              : game.teamTwoGamesWon;
            const gamesLost = isTeamOne
              ? game.teamTwoGamesWon
              : game.teamOneGamesWon;

            return {
              won: acc.won + gamesWon,
              lost: acc.lost + gamesLost,
            };
          },
          { won: 0, lost: 0 },
        );

        // Add games with win/loss info to player data
        const processedGames = playerGames.map((game) => {
          const isTeamOne =
            game.teamOnePlayerOneId === player.id ||
            game.teamOnePlayerTwoId === player.id ||
            game.teamOnePlayerThreeId === player.id;

          return {
            id: game.id,
            date: game.date,
            teamOneGamesWon: game.teamOneGamesWon,
            teamTwoGamesWon: game.teamTwoGamesWon,
            won: isTeamOne
              ? game.teamOneGamesWon > game.teamTwoGamesWon
              : game.teamTwoGamesWon > game.teamOneGamesWon,
          };
        });

        return {
          ...player,
          games: processedGames,
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

  // Games endpoints
  app.get("/api/games", async (_req, res) => {
    try {
      const allGames = await db.select().from(games);
      const allPlayers = await db.select().from(players);

      const gamesWithPlayerNames = allGames.map((game) => ({
        ...game,
        teamOnePlayers: [
          game.teamOnePlayerOneId &&
            allPlayers.find((p) => p.id === game.teamOnePlayerOneId)?.name,
          game.teamOnePlayerTwoId &&
            allPlayers.find((p) => p.id === game.teamOnePlayerTwoId)?.name,
          game.teamOnePlayerThreeId &&
            allPlayers.find((p) => p.id === game.teamOnePlayerThreeId)?.name,
        ].filter(Boolean),
        teamTwoPlayers: [
          game.teamTwoPlayerOneId &&
            allPlayers.find((p) => p.id === game.teamTwoPlayerOneId)?.name,
          game.teamTwoPlayerTwoId &&
            allPlayers.find((p) => p.id === game.teamTwoPlayerTwoId)?.name,
          game.teamTwoPlayerThreeId &&
            allPlayers.find((p) => p.id === game.teamTwoPlayerThreeId)?.name,
        ].filter(Boolean),
      }));

      res.json(gamesWithPlayerNames);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
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

  app.post("/api/games", async (req, res) => {
    try {
      console.log("Recording new game:", req.body);
      const newGame = await db
        .insert(games)
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

  const httpServer = createServer(app);
  return httpServer;
}
