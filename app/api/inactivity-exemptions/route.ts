import { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";

function toCamel(row: any) {
  return {
    id: row.id,
    playerId: row.player_id,
    reason: row.reason,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get('playerId');

  try {
    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    if (playerId) {
      const rows = await sql`
        SELECT * FROM inactivity_exemptions 
        WHERE player_id = ${Number(playerId)}
        ORDER BY start_date
      `;
      return Response.json(rows.map(toCamel));
    }

    const rows = await sql`SELECT * FROM inactivity_exemptions ORDER BY start_date`;
    return Response.json(rows.map(toCamel));
  } catch (e: any) {
    return new Response(e?.message || 'Failed to fetch exemptions', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, reason, startDate, endDate } = body || {};
    
    console.log('POST request body:', { playerId, reason, startDate, endDate });
    
    if (!playerId || !startDate) {
      return new Response('playerId and startDate are required', { status: 400 });
    }
    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    // ensure player exists
    const existing = await sql`SELECT id FROM players WHERE id = ${Number(playerId)} LIMIT 1`;
    if (existing.length === 0) {
      return new Response('Player not found', { status: 404 });
    }

    const sd = new Date(startDate);
    const ed = endDate ? new Date(endDate) : null;

    const inserted = await sql`
      INSERT INTO inactivity_exemptions (player_id, reason, start_date, end_date)
      VALUES (${Number(playerId)}, ${reason || null}, ${sd}, ${ed})
      RETURNING *
    `;

    return Response.json(toCamel(inserted[0]), { status: 201 });
  } catch (e: any) {
    console.error('POST error:', e);
    return new Response(e?.message || 'Failed to create exemption', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, reason, startDate, endDate } = body || {};
    if (!id) return new Response('id is required', { status: 400 });

    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);

    // Load current row to preserve unspecified fields
    const current = await sql`SELECT * FROM inactivity_exemptions WHERE id = ${Number(id)} LIMIT 1`;
    if (current.length === 0) return new Response('Exemption not found', { status: 404 });
    const row = current[0];

    const newReason = (reason !== undefined) ? (reason || null) : row.reason;
    const newStart = (startDate !== undefined && startDate) ? new Date(startDate) : row.start_date;
    const newEnd = (endDate !== undefined) ? (endDate ? new Date(endDate) : null) : row.end_date;

    const updated = await sql`
      UPDATE inactivity_exemptions
      SET reason = ${newReason}, start_date = ${newStart}, end_date = ${newEnd}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return Response.json(toCamel(updated[0]));
  } catch (e: any) {
    return new Response(e?.message || 'Failed to update exemption', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new Response('id is required', { status: 400 });
    if (!process.env.DATABASE_URL) throw new Error('Database URL not configured');
    const sql = neon(process.env.DATABASE_URL);
    await sql`DELETE FROM inactivity_exemptions WHERE id = ${Number(id)}`;
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response(e?.message || 'Failed to delete exemption', { status: 500 });
  }
}
