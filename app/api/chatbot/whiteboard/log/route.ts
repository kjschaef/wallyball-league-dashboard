import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import {
  validateLogPayload,
  matchRosterName,
  computeGamesWon,
  type LogPayload,
} from '../../../../lib/whiteboard';
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit';

/**
 * Log user-confirmed whiteboard matches.
 *
 * Intentionally NOT admin-gated: Keith wants non-admin visitors to be able
 * to use the chatbot, including logging today's matches from a whiteboard
 * photo. The controls here are, in order:
 *  1. Per-IP rate limiting (10 log requests/min) plus a 10-match cap per
 *     request, so a bad actor can only create a bounded amount of noise.
 *  2. Strict server-side validation (validateLogPayload) — the chat UI is
 *     not a trust boundary, so every rule is re-checked here.
 *  3. Roster resolution: every player name must resolve to exactly one
 *     roster player (exact or unique fuzzy match). Ambiguous or unknown
 *     names are rejected, never guessed.
 *
 * This is a deliberate, visible trade-off: opening match logging to
 * visitors means anyone can add matches (the same is already true of
 * signups during an open window). If that proves to be a problem, the fix
 * is to put this endpoint behind the admin token — not to silently
 * re-gate the whole chatbot.
 */
export async function POST(request: NextRequest) {
  const rate = checkRateLimit(getClientIp(request), {
    maxRequests: 10,
    key: 'whiteboard-log',
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
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }

    const body = (await request.json()) as LogPayload;
    const errors = validateLogPayload(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const allPlayers = await sql`SELECT id, name FROM players`;
    const rosterNames = allPlayers.map((p: any) => p.name as string);

    // Resolve every confirmed name to a roster id. Rejects anything the
    // confirmation UI should already have blocked.
    const resolveIds = (names: string[]): { ids: (number | null)[]; unresolved: string[] } => {
      const ids: (number | null)[] = [null, null, null];
      const unresolved: string[] = [];
      names.forEach((name, i) => {
        const m = matchRosterName(name, rosterNames);
        if (m.matched) {
          const row = allPlayers.find((p: any) => p.name === m.matched);
          ids[i] = row ? row.id : null;
          if (!row) unresolved.push(name);
        } else {
          unresolved.push(name);
        }
      });
      return { ids, unresolved };
    };

    const unresolved: string[] = [];
    const prepared = body.matches.map((m) => {
      const teamOne = resolveIds(m.teamOnePlayers);
      const teamTwo = resolveIds(m.teamTwoPlayers);
      unresolved.push(...teamOne.unresolved, ...teamTwo.unresolved);
      return { teamOneIds: teamOne.ids, teamTwoIds: teamTwo.ids, games: m.games };
    });
    if (unresolved.length > 0) {
      return NextResponse.json(
        { error: `Could not resolve these players to the roster: ${[...new Set(unresolved)].join(', ')}` },
        { status: 400 }
      );
    }

    const logged = [];
    for (const m of prepared) {
      const wins = computeGamesWon(m.games);
      const inserted = await sql`
        INSERT INTO matches (
          team_one_player_one_id, team_one_player_two_id, team_one_player_three_id,
          team_two_player_one_id, team_two_player_two_id, team_two_player_three_id,
          team_one_games_won, team_two_games_won, date
        )
        VALUES (
          ${m.teamOneIds[0]}, ${m.teamOneIds[1]}, ${m.teamOneIds[2]},
          ${m.teamTwoIds[0]}, ${m.teamTwoIds[1]}, ${m.teamTwoIds[2]},
          ${wins.teamOne}, ${wins.teamTwo}, ${new Date(body.date + 'T12:00:00')}
        )
        RETURNING *
      `;
      const match = inserted[0];
      for (let i = 0; i < m.games.length; i++) {
        const g = m.games[i];
        await sql`
          INSERT INTO match_games (match_id, game_number, team_one_score, team_two_score)
          VALUES (${match.id}, ${i + 1}, ${g.teamOneScore}, ${g.teamTwoScore})
        `;
      }
      logged.push({
        id: match.id,
        teamOneGamesWon: wins.teamOne,
        teamTwoGamesWon: wins.teamTwo,
        gameCount: m.games.length,
      });
    }

    return NextResponse.json({ logged, date: body.date }, { status: 201 });
  } catch (error) {
    console.error('Whiteboard log API error:', error);
    return NextResponse.json(
      { error: 'Failed to log matches' },
      { status: 500 }
    );
  }
}
