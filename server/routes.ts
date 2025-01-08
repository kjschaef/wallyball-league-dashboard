import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { players, matches } from "@db/schema";

export function registerRoutes(app: Express): Server {
  // Players endpoints
  app.get("/api/players", async (_req, res) => {
    const allPlayers = await db.query.players.findMany({
      with: { matches: true },
    });
    res.json(allPlayers);
  });

  app.post("/api/players", async (req, res) => {
    const newPlayer = await db.insert(players).values(req.body).returning();
    res.json(newPlayer[0]);
  });

  app.put("/api/players/:id", async (req, res) => {
    const updatedPlayer = await db
      .update(players)
      .set(req.body)
      .where(eq(players.id, parseInt(req.params.id)))
      .returning();
    res.json(updatedPlayer[0]);
  });

  app.delete("/api/players/:id", async (req, res) => {
    await db.delete(players).where(eq(players.id, parseInt(req.params.id)));
    res.status(204).end();
  });

  // Matches endpoints
  app.get("/api/matches", async (_req, res) => {
    const allMatches = await db.query.matches.findMany({
      with: { player: true },
    });
    res.json(allMatches);
  });

  app.post("/api/matches", async (req, res) => {
    const newMatch = await db.insert(matches).values(req.body).returning();
    res.json(newMatch[0]);
  });

  const httpServer = createServer(app);
  return httpServer;
}
