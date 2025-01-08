import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { players, matches } from "@db/schema";

export function registerRoutes(app: Express): Server {
  // Players endpoints
  app.get("/api/players", async (_req, res) => {
    try {
      console.log("Fetching all players");
      const allPlayers = await db.select().from(players);
      console.log("Successfully fetched players:", allPlayers);

      // Get all matches for calculation
      const allMatches = await db.select().from(matches);
      console.log("Successfully fetched matches:", allMatches);

      // Calculate stats for each player
      const playersWithStats = allPlayers.map(player => {
        const playerMatches = allMatches.filter(match => 
          match.team1Player1Id === player.id ||
          match.team1Player2Id === player.id ||
          match.team2Player1Id === player.id ||
          match.team2Player2Id === player.id
        );

        const stats = playerMatches.reduce((acc, match) => {
          const isTeam1 = match.team1Player1Id === player.id || match.team1Player2Id === player.id;
          const won = isTeam1 ? match.team1Score > match.team2Score : match.team2Score > match.team1Score;
          return {
            won: acc.won + (won ? 1 : 0),
            lost: acc.lost + (won ? 0 : 1),
          };
        }, { won: 0, lost: 0 });

        return {
          ...player,
          matches: playerMatches.map(match => ({
            ...match,
            won: (match.team1Player1Id === player.id || match.team1Player2Id === player.id) 
              ? match.team1Score > match.team2Score 
              : match.team2Score > match.team1Score,
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

  // Matches endpoints
  app.post("/api/matches", async (req, res) => {
    try {
      console.log("Recording new match:", req.body);
      const newMatch = await db.insert(matches).values({
        team1Player1Id: req.body.team1Player1Id,
        team1Player2Id: req.body.team1Player2Id,
        team2Player1Id: req.body.team2Player1Id,
        team2Player2Id: req.body.team2Player2Id,
        team1Score: req.body.team1Score,
        team2Score: req.body.team2Score,
      }).returning();
      console.log("Match recorded:", newMatch[0]);
      res.json(newMatch[0]);
    } catch (error) {
      console.error("Error recording match:", error);
      res.status(500).json({ error: "Failed to record match" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}