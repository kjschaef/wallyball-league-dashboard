/**
 * Whiteboard match-logging: shared types, roster matching, and validation.
 *
 * This module is dependency-free on purpose so it can be unit-tested in
 * isolation. It covers the NEW whiteboard format (handwritten full first
 * names + per-game numeric scores, circled score = that game's winner),
 * which is different from the legacy initials + tally-marks format the old
 * image prompts assumed.
 *
 * Safety rules enforced here (and re-checked server-side before any insert):
 * - Never invent scores: a team pairing with no scores is `played: false`
 *   and is never logged as a match.
 * - Never guess a player: a name that doesn't match the roster exactly is
 *   flagged (`fuzzy` / `ambiguous` / `unknown`) for the user to confirm or
 *   fix. The confirmation UI blocks logging while any player is unresolved.
 * - A game can never end in a tie, and scores are non-negative integers.
 */

export interface WhiteboardGameScore {
  teamOneScore: number;
  teamTwoScore: number;
}

/** One match exactly as the vision model returned it (raw handwritten names). */
export interface WhiteboardMatchRaw {
  matchNumber: number;
  teamOne: { players: string[] };
  teamTwo: { players: string[] };
  games: WhiteboardGameScore[];
  /** False when the board shows the team pairing but no scores yet. */
  played: boolean;
}

export type RosterMatchConfidence = 'exact' | 'fuzzy' | 'ambiguous' | 'unknown';

export interface MatchedPlayer {
  /** Name exactly as read from the board. */
  raw: string;
  /** Roster name, or null when it could not be resolved. */
  matched: string | null;
  confidence: RosterMatchConfidence;
  /** Other roster names that could also match (for ambiguous). */
  candidates: string[];
}

export interface WhiteboardTeam {
  players: MatchedPlayer[];
}

export interface WhiteboardMatch {
  matchNumber: number;
  teamOne: WhiteboardTeam;
  teamTwo: WhiteboardTeam;
  games: WhiteboardGameScore[];
  played: boolean;
  /** True when anything about this match needs a human eye before logging. */
  needsReview: boolean;
  reviewReasons: string[];
}

export interface NormalizedWhiteboardResult {
  matches: WhiteboardMatch[];
  /** Roster names the model was given (for the UI to offer as fixes). */
  roster: string[];
}

/** Levenshtein distance, used for typo-tolerant roster matching. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr.push(
        Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        )
      );
    }
    prev = curr;
  }
  return prev[n];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** First token of a name ("Nate Smith" -> "nate"). */
function firstToken(name: string): string {
  return normalizeName(name).split(' ')[0];
}

/**
 * Match one handwritten name against the roster.
 * - exact: case-insensitive match on the full name or its first token.
 * - fuzzy: exactly one roster name within edit distance 2 (typo tolerance).
 * - ambiguous: two or more roster names plausibly match — never pick one.
 * - unknown: nothing close — the user must fix it.
 */
export function matchRosterName(raw: string, roster: string[]): MatchedPlayer {
  const norm = normalizeName(raw);
  if (!norm) {
    return { raw, matched: null, confidence: 'unknown', candidates: [] };
  }

  const exact = roster.find(
    (r) => normalizeName(r) === norm || firstToken(r) === norm
  );
  if (exact) {
    return { raw, matched: exact, confidence: 'exact', candidates: [] };
  }

  const dist1 = roster.filter((r) => {
    const full = normalizeName(r);
    const first = firstToken(r);
    return levenshtein(norm, full) === 1 || levenshtein(norm, first) === 1;
  });
  if (dist1.length === 1) {
    return { raw, matched: dist1[0], confidence: 'fuzzy', candidates: [] };
  }
  if (dist1.length > 1) {
    return { raw, matched: null, confidence: 'ambiguous', candidates: dist1 };
  }

  const close = roster.filter((r) => {
    const full = normalizeName(r);
    const first = firstToken(r);
    return (
      levenshtein(norm, full) <= 2 ||
      levenshtein(norm, first) <= 2 ||
      (norm.length >= 3 && (full.startsWith(norm) || first.startsWith(norm)))
    );
  });

  if (close.length === 1) {
    return { raw, matched: close[0], confidence: 'fuzzy', candidates: [] };
  }
  if (close.length > 1) {
    return { raw, matched: null, confidence: 'ambiguous', candidates: close };
  }
  return { raw, matched: null, confidence: 'unknown', candidates: [] };
}

function normalizeTeam(
  rawPlayers: string[],
  roster: string[],
  reasons: string[]
): WhiteboardTeam {
  const players = rawPlayers.map((raw) => matchRosterName(raw, roster));
  for (const p of players) {
    if (p.confidence === 'fuzzy') {
      reasons.push(`"${p.raw}" read as "${p.matched}" — please confirm`);
    } else if (p.confidence === 'ambiguous') {
      reasons.push(
        `"${p.raw}" could be ${p.candidates.join(' or ')} — please pick one`
      );
    } else if (p.confidence === 'unknown') {
      reasons.push(`"${p.raw}" is not on the roster — please fix or add the player`);
    }
  }
  return { players };
}

/**
 * Map raw vision output onto the roster, flagging anything uncertain.
 * A match is only loggable when played, every player resolved exactly or
 * by a user-confirmed fuzzy match, and every game has a decisive score.
 */
export function normalizeWhiteboardMatches(
  rawMatches: WhiteboardMatchRaw[],
  roster: string[]
): NormalizedWhiteboardResult {
  const matches = rawMatches.map((raw) => {
    const reasons: string[] = [];
    const teamOne = normalizeTeam(raw.teamOne.players, roster, reasons);
    const teamTwo = normalizeTeam(raw.teamTwo.players, roster, reasons);

    if (raw.teamOne.players.length === 0 || raw.teamTwo.players.length === 0) {
      reasons.push('A team has no players listed');
    }
    if (raw.teamOne.players.length > 3 || raw.teamTwo.players.length > 3) {
      reasons.push('A team has more than 3 players');
    }
    if (!raw.played) {
      reasons.push('No scores on the board yet — this matchup has not been played');
    }
    if (raw.played && raw.games.length === 0) {
      reasons.push('Marked as played but no game scores were read');
    }
    for (let i = 0; i < raw.games.length; i++) {
      const g = raw.games[i];
      if (!Number.isInteger(g.teamOneScore) || !Number.isInteger(g.teamTwoScore)) {
        reasons.push(`Game ${i + 1} has a non-integer score`);
      } else if (g.teamOneScore < 0 || g.teamTwoScore < 0) {
        reasons.push(`Game ${i + 1} has a negative score`);
      } else if (g.teamOneScore === g.teamTwoScore) {
        reasons.push(`Game ${i + 1} is tied — a game cannot end in a tie`);
      }
    }

    return {
      matchNumber: raw.matchNumber,
      teamOne,
      teamTwo,
      games: raw.games,
      played: raw.played,
      needsReview: reasons.length > 0,
      reviewReasons: reasons,
    };
  });

  return { matches, roster };
}

export function computeGamesWon(games: WhiteboardGameScore[]): {
  teamOne: number;
  teamTwo: number;
} {
  return {
    teamOne: games.filter((g) => g.teamOneScore > g.teamTwoScore).length,
    teamTwo: games.filter((g) => g.teamTwoScore > g.teamOneScore).length,
  };
}

/** A match the user confirmed, ready for the log endpoint. */
export interface ConfirmedWhiteboardMatch {
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  games: WhiteboardGameScore[];
}

export interface LogPayload {
  /** YYYY-MM-DD, the day the matches were played. */
  date: string;
  matches: ConfirmedWhiteboardMatch[];
}

/**
 * Server-side validation for the log endpoint. Returns error strings;
 * an empty array means the payload is safe to insert. This must stay in
 * sync with what the confirmation UI enforces, because the UI is not a
 * trust boundary — anyone can POST to the endpoint directly.
 */
export function validateLogPayload(payload: LogPayload): string[] {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return ['Request body must be an object'];
  }
  if (typeof payload.date !== 'string' || Number.isNaN(Date.parse(payload.date))) {
    errors.push('A valid date is required');
  }
  if (!Array.isArray(payload.matches) || payload.matches.length === 0) {
    errors.push('At least one match is required');
    return errors;
  }
  if (payload.matches.length > 10) {
    errors.push('At most 10 matches can be logged in one request');
  }

  payload.matches.forEach((m, i) => {
    const label = `Match ${i + 1}`;
    if (!m || typeof m !== 'object') {
      errors.push(`${label} is malformed`);
      return;
    }
    for (const [teamLabel, players] of [
      ['Team 1', m.teamOnePlayers],
      ['Team 2', m.teamTwoPlayers],
    ] as const) {
      if (!Array.isArray(players) || players.length === 0) {
        errors.push(`${label}: ${teamLabel} needs at least one player`);
      } else if (players.length > 3) {
        errors.push(`${label}: ${teamLabel} has more than 3 players`);
      } else if (players.some((p) => typeof p !== 'string' || p.trim() === '')) {
        errors.push(`${label}: ${teamLabel} has an empty player name`);
      }
    }
    if (!Array.isArray(m.games) || m.games.length === 0) {
      errors.push(`${label}: at least one game score is required (unplayed matchups cannot be logged)`);
      return;
    }
    m.games.forEach((g, gi) => {
      if (
        !g ||
        !Number.isInteger(g.teamOneScore) ||
        !Number.isInteger(g.teamTwoScore) ||
        g.teamOneScore < 0 ||
        g.teamTwoScore < 0
      ) {
        errors.push(`${label} game ${gi + 1}: scores must be non-negative integers`);
      } else if (g.teamOneScore === g.teamTwoScore) {
        errors.push(`${label} game ${gi + 1}: a game cannot end in a tie`);
      }
    });
  });

  return errors;
}
