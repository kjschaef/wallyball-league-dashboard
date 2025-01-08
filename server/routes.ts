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

      const playersWithStats = allPlayers.map(player => {
        const playerGames = allGames.filter(game => 
          game.teamOnePlayerOneId === player.id ||
          game.teamOnePlayerTwoId === player.id ||
          game.teamOnePlayerThreeId === player.id ||
          game.teamTwoPlayerOneId === player.id ||
          game.teamTwoPlayerTwoId === player.id ||
          game.teamTwoPlayerThreeId === player.id
        );

        const stats = playerGames.reduce((acc, game) => {
          const isTeamOne = 
            game.teamOnePlayerOneId === player.id ||
            game.teamOnePlayerTwoId === player.id ||
            game.teamOnePlayerThreeId === player.id;

          const won = isTeamOne 
            ? game.teamOneGamesWon > game.teamTwoGamesWon
            : game.teamTwoGamesWon > game.teamOneGamesWon;

          return {
            won: acc.won + (won ? 1 : 0),
            lost: acc.lost + (won ? 0 : 1),
          };
        }, { won: 0, lost: 0 });

        return {
          ...player,
          games: playerGames.map(game => ({
            ...game,
            won: (
              game.teamOnePlayerOneId === player.id ||
              game.teamOnePlayerTwoId === player.id ||
              game.teamOnePlayerThreeId === player.id
            )
              ? game.teamOneGamesWon > game.teamTwoGamesWon
              : game.teamTwoGamesWon > game.teamOneGamesWon,
          })),
          stats,
        };
      });

      console.log(`Found ${playersWithStats.length} players with their stats`);
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

  app.put("/api/players/:id", async (req, res) => {
    try {
      console.log(`Updating player ${req.params.id}:`, req.body);
      const updatedPlayer = await db
        .update(players)
        .set(req.body)
        .where(eq(players.id, parseInt(req.params.id)))
        .returning();
      console.log("Player updated:", updatedPlayer[0]);
      res.json(updatedPlayer[0]);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ error: "Failed to update player" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      console.log(`Deleting player ${req.params.id}`);
      await db.delete(players).where(eq(players.id, parseInt(req.params.id)));
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ error: "Failed to delete player" });
    }
  });

  // Games endpoints
  app.post("/api/games", async (req, res) => {
    try {
      console.log("Recording new game:", req.body);
      const newGame = await db.insert(games).values({
        teamOnePlayerOneId: req.body.teamOnePlayerOneId,
        teamOnePlayerTwoId: req.body.teamOnePlayerTwoId,
        teamOnePlayerThreeId: req.body.teamOnePlayerThreeId,
        teamTwoPlayerOneId: req.body.teamTwoPlayerOneId,
        teamTwoPlayerTwoId: req.body.teamTwoPlayerTwoId,
        teamTwoPlayerThreeId: req.body.teamTwoPlayerThreeId,
        teamOneGamesWon: req.body.teamOneGamesWon,
        teamTwoGamesWon: req.body.teamTwoGamesWon,
      }).returning();
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