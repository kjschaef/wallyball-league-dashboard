'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import {
  matchRosterName,
  computeGamesWon,
  type WhiteboardMatch,
} from '../lib/whiteboard';

interface EditableGame {
  teamOneScore: string;
  teamTwoScore: string;
}

interface EditableMatch {
  matchNumber: number;
  teamOnePlayers: string;
  teamTwoPlayers: string;
  games: EditableGame[];
  played: boolean;
  needsReview: boolean;
  reviewReasons: string[];
}

interface WhiteboardResultsCardProps {
  matches: WhiteboardMatch[];
  /** YYYY-MM-DD, the day these matches were played (defaults to today). */
  initialDate: string;
  roster: string[];
}

function toEditable(m: WhiteboardMatch): EditableMatch {
  const names = (team: WhiteboardMatch['teamOne']) =>
    team.players.map((p) => p.matched ?? p.raw).join(', ');
  return {
    matchNumber: m.matchNumber,
    teamOnePlayers: names(m.teamOne),
    teamTwoPlayers: names(m.teamTwo),
    games: m.games.map((g) => ({
      teamOneScore: String(g.teamOneScore),
      teamTwoScore: String(g.teamTwoScore),
    })),
    played: m.played,
    needsReview: m.needsReview,
    reviewReasons: m.reviewReasons,
  };
}

function splitNames(input: string): string[] {
  return input.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Confirmation + editing card for whiteboard matches.
 *
 * Nothing is logged until the user presses "Confirm & log matches", and a
 * match can only be logged when it is marked played, every player resolves
 * to the roster, and every game has a decisive score. Unplayed matchups
 * (teams with no scores on the board) are shown but never logged.
 */
export function WhiteboardResultsCard({ matches, initialDate, roster }: WhiteboardResultsCardProps) {
  const [date, setDate] = useState(initialDate);
  const [editable, setEditable] = useState<EditableMatch[]>(() => matches.map(toEditable));
  const [isLogging, setIsLogging] = useState(false);
  const [loggedCount, setLoggedCount] = useState<number | null>(null);
  const [logError, setLogError] = useState<string | null>(null);

  const updateMatch = (index: number, patch: Partial<EditableMatch>) => {
    setEditable((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const updateGame = (matchIndex: number, gameIndex: number, patch: Partial<EditableGame>) => {
    setEditable((prev) =>
      prev.map((m, i) =>
        i === matchIndex
          ? {
              ...m,
              games: m.games.map((g, gi) => (gi === gameIndex ? { ...g, ...patch } : g)),
            }
          : m
      )
    );
  };

  /** Client-side mirror of the server rules; the server re-checks everything. */
  const matchProblems = (m: EditableMatch): string[] => {
    const problems: string[] = [];
    if (!m.played) {
      problems.push('Not played yet');
      return problems;
    }
    for (const [label, raw] of [
      ['Team 1', m.teamOnePlayers],
      ['Team 2', m.teamTwoPlayers],
    ] as const) {
      const names = splitNames(raw);
      if (names.length === 0) problems.push(`${label} needs at least one player`);
      if (names.length > 3) problems.push(`${label} has more than 3 players`);
      for (const name of names) {
        const resolved = matchRosterName(name, roster);
        if (!resolved.matched) {
          problems.push(
            resolved.confidence === 'ambiguous'
              ? `"${name}" could be ${resolved.candidates.join(' or ')}`
              : `"${name}" is not on the roster`
          );
        }
      }
    }
    if (m.games.length === 0) {
      problems.push('At least one game score is required');
    }
    m.games.forEach((g, gi) => {
      const one = Number(g.teamOneScore);
      const two = Number(g.teamTwoScore);
      if (
        g.teamOneScore === '' ||
        g.teamTwoScore === '' ||
        !Number.isInteger(one) ||
        !Number.isInteger(two) ||
        one < 0 ||
        two < 0
      ) {
        problems.push(`Game ${gi + 1}: scores must be non-negative whole numbers`);
      } else if (one === two) {
        problems.push(`Game ${gi + 1}: a game cannot end in a tie`);
      }
    });
    return problems;
  };

  const loggable = editable.filter((m) => m.played && matchProblems(m).length === 0);

  const handleConfirm = async () => {
    if (loggable.length === 0 || isLogging) return;
    setIsLogging(true);
    setLogError(null);
    try {
      const payload = {
        date,
        matches: loggable.map((m) => ({
          teamOnePlayers: splitNames(m.teamOnePlayers),
          teamTwoPlayers: splitNames(m.teamTwoPlayers),
          games: m.games.map((g) => ({
            teamOneScore: Number(g.teamOneScore),
            teamTwoScore: Number(g.teamTwoScore),
          })),
        })),
      };
      const response = await fetch('/api/chatbot/whiteboard/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log matches');
      }
      setLoggedCount(data.logged?.length ?? loggable.length);
    } catch (error) {
      console.error('Failed to log whiteboard matches:', error);
      setLogError(error instanceof Error ? error.message : 'Failed to log matches');
    } finally {
      setIsLogging(false);
    }
  };

  if (loggedCount !== null) {
    return (
      <Card className="mt-2 bg-green-50 border-green-200">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-green-900">
            ✅ Logged {loggedCount} match{loggedCount !== 1 ? 'es' : ''} for {date}.
          </p>
          <p className="text-xs text-green-700 mt-1">
            Unplayed matchups (if any) were left out — log them once they have scores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-2 bg-green-50 border-green-200">
      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-green-900">Whiteboard matches — please check before logging</h4>
          <p className="text-xs text-green-700 mt-1">
            Nothing is logged until you confirm. Fix any misread names or scores below.
          </p>
          <label className="text-xs font-medium text-green-900 block mt-3 mb-1" htmlFor="whiteboard-date">
            Date these matches were played
          </label>
          <Input
            id="whiteboard-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white"
          />
        </div>

        {editable.map((m, mi) => {
          const problems = matchProblems(m);
          const wins = m.played
            ? computeGamesWon(
                m.games
                  .filter((g) => g.teamOneScore !== '' && g.teamTwoScore !== '')
                  .map((g) => ({ teamOneScore: Number(g.teamOneScore), teamTwoScore: Number(g.teamTwoScore) }))
                  .filter((g) => Number.isInteger(g.teamOneScore) && Number.isInteger(g.teamTwoScore))
              )
            : null;
          return (
            <div key={mi} className="bg-white/70 rounded-lg p-3 space-y-2 border border-green-100">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-green-900 text-sm">Match {m.matchNumber}</h5>
                {wins && (
                  <span className="text-sm font-bold text-green-900">
                    {wins.teamOne} - {wins.teamTwo}
                  </span>
                )}
              </div>

              {(m.needsReview || problems.length > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800 space-y-1">
                  {m.reviewReasons.map((r, i) => (
                    <p key={i}>⚠️ {r}</p>
                  ))}
                  {problems
                    .filter((p) => p !== 'Not played yet')
                    .map((p, i) => (
                      <p key={`p${i}`}>⚠️ {p}</p>
                    ))}
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-medium text-green-900">
                <input
                  type="checkbox"
                  checked={m.played}
                  onChange={(e) => updateMatch(mi, { played: e.target.checked })}
                />
                Played (has scores)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-green-900">Team 1</label>
                  <Input
                    value={m.teamOnePlayers}
                    onChange={(e) => updateMatch(mi, { teamOnePlayers: e.target.value })}
                    placeholder="Nate, Ben, Keith"
                    className="bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-green-900">Team 2</label>
                  <Input
                    value={m.teamTwoPlayers}
                    onChange={(e) => updateMatch(mi, { teamTwoPlayers: e.target.value })}
                    placeholder="Hal, Mark, Vamsi"
                    className="bg-white text-sm"
                  />
                </div>
              </div>

              {m.played && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-green-900">Game scores (team 1 — team 2)</p>
                  {m.games.map((g, gi) => (
                    <div key={gi} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-10">Game {gi + 1}</span>
                      <Input
                        type="number"
                        min={0}
                        value={g.teamOneScore}
                        onChange={(e) => updateGame(mi, gi, { teamOneScore: e.target.value })}
                        className="bg-white text-sm"
                        aria-label={`Match ${m.matchNumber} game ${gi + 1} team 1 score`}
                      />
                      <span className="text-xs text-gray-500">—</span>
                      <Input
                        type="number"
                        min={0}
                        value={g.teamTwoScore}
                        onChange={(e) => updateGame(mi, gi, { teamTwoScore: e.target.value })}
                        className="bg-white text-sm"
                        aria-label={`Match ${m.matchNumber} game ${gi + 1} team 2 score`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateMatch(mi, { games: m.games.filter((_, i) => i !== gi) })
                        }
                        aria-label="Remove game"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateMatch(mi, { games: [...m.games, { teamOneScore: '', teamTwoScore: '' }] })
                    }
                  >
                    + Add game
                  </Button>
                </div>
              )}

              {!m.played && (
                <p className="text-xs text-gray-600">
                  No scores on the board yet — this matchup will not be logged. Tick “Played”
                  and add scores if it has been played since the photo.
                </p>
              )}
            </div>
          );
        })}

        {logError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{logError}</p>
        )}

        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={isLogging || loggable.length === 0}
        >
          {isLogging
            ? 'Logging…'
            : loggable.length === 0
              ? 'Nothing loggable yet — fix the flagged matches above'
              : `Confirm & log ${loggable.length} match${loggable.length !== 1 ? 'es' : ''} for ${date}`}
        </Button>
      </CardContent>
    </Card>
  );
}
