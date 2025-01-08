import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { players, matches } from "@db/schema";

export function registerRoutes(app: Express): Server {
  // Players endpoints
  app.get("/api/players", async (_req, res) => {
    try {
      console.log("Fetching all players with their matches");
      const allPlayers = await db.query.players.findMany({
        with: { matches: true },
      });
      console.log(`Found ${allPlayers.length} players`);
      res.json(allPlayers);
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
  app.get("/api/matches", async (_req, res) => {
    try {
      console.log("Fetching all matches with player details");
      const allMatches = await db.query.matches.findMany({
        with: { player: true },
      });
      console.log(`Found ${allMatches.length} matches`);
      res.json(allMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.post("/api/matches", async (req, res) => {
    try {
      console.log("Recording new match:", req.body);
      const newMatch = await db.insert(matches).values(req.body).returning();
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