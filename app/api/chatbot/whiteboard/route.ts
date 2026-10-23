import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { analyzeWhiteboardScores } from '../../../lib/openai';
import { normalizeWhiteboardMatches } from '../../../lib/whiteboard';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — bounds OpenAI vision spend per request

/**
 * Parse a whiteboard photo into matches for the user to confirm.
 *
 * Intentionally NOT admin-gated: any visitor may use the chatbot, and the
 * abuse control here is the per-IP rate limit (20/min) plus the image-size
 * cap. Nothing is logged by this endpoint — logging happens only through
 * ./log after the user confirms the parsed matches.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(getClientIp(request), {
    maxRequests: 20,
    key: 'whiteboard-parse',
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a moment and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rate.retryAfterMs ?? 60000) / 1000)) },
      }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const playerNamesStr = formData.get('playerNames') as string | null;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large — please use a photo under 10 MB' },
        { status: 413 }
      );
    }

    // Roster from the database when available (server-side, so a client
    // cannot spoof the roster to mis-map names). Fall back to the names
    // the client sends, then to an empty roster (names still returned raw
    // and flagged for the user to fix).
    let roster: string[] = [];
    try {
      if (process.env.DATABASE_URL) {
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql`SELECT name FROM players`;
        roster = rows.map((r: any) => r.name).filter(Boolean);
      }
    } catch (error) {
      console.error('Failed to load roster for whiteboard parse:', error);
    }
    if (roster.length === 0 && playerNamesStr) {
      try {
        const parsed = JSON.parse(playerNamesStr);
        if (Array.isArray(parsed)) roster = parsed.filter((n) => typeof n === 'string');
      } catch {
        // Ignore malformed client names; the model result is still usable.
      }
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const parsed = await analyzeWhiteboardScores(imageBuffer);

    if (parsed?.error) {
      return NextResponse.json(
        {
          error: parsed.error,
          response: 'I could not read the whiteboard photo. Please try a clearer, straight-on photo.',
          type: 'error',
        },
        { status: 500 }
      );
    }

    const rawMatches = Array.isArray(parsed?.matches) ? parsed.matches : [];
    const normalized = normalizeWhiteboardMatches(rawMatches, roster);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return NextResponse.json({
      response: 'Here are the matches I read from the whiteboard. Please check them before I log anything:',
      type: 'whiteboard_results',
      timestamp: new Date().toISOString(),
      date: dateStr,
      additionalData: {
        matches: normalized.matches,
        roster: normalized.roster,
        date: dateStr,
      },
    });
  } catch (error) {
    console.error('Whiteboard parse API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process image',
        response: 'I apologize, but I encountered an error processing your photo. Please try again.',
        type: 'error',
      },
      { status: 500 }
    );
  }
}
