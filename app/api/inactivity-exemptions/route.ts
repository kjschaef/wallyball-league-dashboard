import { NextRequest } from "next/server";
import { db } from "../../../db";
import { inactivityExemptions, players } from "../../../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get('playerId');

  try {
    if (playerId) {
      const rows = await db
        .select()
        .from(inactivityExemptions)
        .where(eq(inactivityExemptions.playerId, Number(playerId)))
        .orderBy(inactivityExemptions.startDate);
      return Response.json(rows);
    }

    const rows = await db.select().from(inactivityExemptions).orderBy(inactivityExemptions.startDate);
    return Response.json(rows);
  } catch (e: any) {
    return new Response(e?.message || 'Failed to fetch exemptions', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, reason, startDate, endDate } = body || {};
    if (!playerId || !startDate) {
      return new Response('playerId and startDate are required', { status: 400 });
    }

    // ensure player exists
    const existing = await db.select({ id: players.id }).from(players).where(eq(players.id, Number(playerId)));
    if (existing.length === 0) {
      return new Response('Player not found', { status: 404 });
    }

    const [inserted] = await db.insert(inactivityExemptions).values({
      playerId: Number(playerId),
      reason: reason || null,
      startDate: new Date(startDate) as any,
      endDate: endDate ? (new Date(endDate) as any) : null,
    }).returning();

    return Response.json(inserted, { status: 201 });
  } catch (e: any) {
    return new Response(e?.message || 'Failed to create exemption', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, reason, startDate, endDate } = body || {};
    if (!id) return new Response('id is required', { status: 400 });

    const [updated] = await db.update(inactivityExemptions).set({
      reason: reason ?? undefined,
      startDate: startDate ? (new Date(startDate) as any) : undefined,
      endDate: endDate !== undefined ? (endDate ? (new Date(endDate) as any) : null) : undefined,
    }).where(eq(inactivityExemptions.id, Number(id))).returning();

    return Response.json(updated);
  } catch (e: any) {
    return new Response(e?.message || 'Failed to update exemption', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new Response('id is required', { status: 400 });
    await db.delete(inactivityExemptions).where(eq(inactivityExemptions.id, Number(id)));
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response(e?.message || 'Failed to delete exemption', { status: 500 });
  }
}

