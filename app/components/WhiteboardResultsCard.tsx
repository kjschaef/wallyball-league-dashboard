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
  fuzzyNotes: string[];
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
  const fuzzyNotes = [
    ...m.teamOne.players,
    ...m.teamTwo.players,
  ]
    .filter((p) => p.confidence === 'fuzzy' && p.matched)
    .map((p) => `"${p.raw}" read as "${p.matched}" — please confirm`);
  return {
    matchNumber: m.matchNumber,
    teamOnePlayers: names(m.teamOne),
    teamTwoPlayers: names(m.teamTwo),
    games: m.games.map((g) => ({
      teamOneScore: String(g.teamOneScore),
      teamTwoScore: String(g.teamTwoScore),
    })),
    played: m.played,
    fuzzyNotes,
  };
}

function splitNames(input: string): string[] {
  return input.split(',').map((s) => s.trim()).filter(Boolean);
}

interface MatchIssue {
  message: string;
  unknownName?: string;
  ambiguous?: {
    raw: string;
    teamKey: 'teamOnePlayers' | 'teamTwoPlayers';
    candidates: string[];
  };
}

/**
 * Confirmation + editing card for whiteboard matches.
 *
 * Nothing is logged until the user presses "Confirm & log matches", and a
 * match can only be logged when it is marked played, every player resolves
 * to the roster (or is added as a new player), and every game has a decisive
 * score. Unplayed matchups (teams with no scores on the board) are shown
 * clearly as skipped and never logged unless ticked as played.
 */
export function WhiteboardResultsCard({ matches, initialDate, roster }: WhiteboardResultsCardProps) {
  const [date, setDate] = useState(initialDate);
  const [editable, setEditable] = useState<EditableMatch[]>(() => matches.map(toEditable));
  const [activeRoster, setActiveRoster] = useState<string[]>(() => roster);
  const [newPlayers, setNewPlayers] = useState<string[]>([]);
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

  const addNewPlayerToRoster = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;
    setActiveRoster((prev) =>
      prev.some((r) => r.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]
    );
    setNewPlayers((prev) =>
      prev.some((r) => r.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]
    );
  };

  const replacePlayerNameInTeam = (
    matchIndex: number,
    teamKey: 'teamOnePlayers' | 'teamTwoPlayers',
    rawName: string,
    replacement: string
  ) => {
    setEditable((prev) =>
      prev.map((m, i) => {
        if (i !== matchIndex) return m;
        const currentNames = splitNames(m[teamKey]);
        const updated = currentNames.map((n) =>
          n.toLowerCase() === rawName.toLowerCase() ? replacement : n
        );
        return { ...m, [teamKey]: updated.join(', ') };
      })
    );
  };

  /** Client-side mirror of the server rules; the server re-checks everything. */
  const getMatchIssues = (m: EditableMatch): MatchIssue[] => {
    const issues: MatchIssue[] = [];
    if (!m.played) {
      return [{ message: 'Not played yet' }];
    }
    for (const [label, teamKey, raw] of [
      ['Team 1', 'teamOnePlayers', m.teamOnePlayers],
      ['Team 2', 'teamTwoPlayers', m.teamTwoPlayers],
    ] as const) {
      const names = splitNames(raw);
      if (names.length === 0) issues.push({ message: `${label} needs at least one player` });
      if (names.length > 3) issues.push({ message: `${label} has more than 3 players` });
      for (const name of names) {
        const resolved = matchRosterName(name, activeRoster);
        if (!resolved.matched) {
          if (resolved.confidence === 'ambiguous') {
            issues.push({
              message: `"${name}" could be ${resolved.candidates.join(' or ')} — please pick one`,
              ambiguous: { raw: name, teamKey, candidates: resolved.candidates },
            });
          } else {
            issues.push({
              message: `"${name}" is not on the roster — fix the spelling or add as a new player`,
              unknownName: name,
            });
          }
        }
      }
    }
    if (m.games.length === 0) {
      issues.push({ message: 'At least one game score is required' });
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
        issues.push({ message: `Game ${gi + 1}: scores must be non-negative whole numbers` });
      } else if (one === two) {
        issues.push({ message: `Game ${gi + 1}: a game cannot end in a tie` });
      }
    });
    return issues;
  };

  const allUnknownNames = Array.from(
    new Set(
      editable
        .filter((m) => m.played)
        .flatMap((m) => getMatchIssues(m))
        .map((issue) => issue.unknownName)
        .filter((n): n is string => Boolean(n))
    )
  );

  const addAllUnknownPlayers = () => {
    for (const name of allUnknownNames) {
      addNewPlayerToRoster(name);
    }
  };

  const loggable = editable.filter((m) => m.played && getMatchIssues(m).length === 0);

  const handleConfirm = async () => {
    if (loggable.length === 0 || isLogging) return;
    setIsLogging(true);
    setLogError(null);
    try {
      const payload: {
        date: string;
        matches: Array<{
          teamOnePlayers: string[];
          teamTwoPlayers: string[];
          games: Array<{ teamOneScore: number; teamTwoScore: number }>;
        }>;
        newPlayers?: string[];
      } = {
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
      if (newPlayers.length > 0) {
        payload.newPlayers = newPlayers;
      }
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
          {allUnknownNames.length > 1 && (
            <div className="mt-3 flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-900">
              <span>
                {allUnknownNames.length} players ({allUnknownNames.join(', ')}) are not on the roster yet.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={addAllUnknownPlayers}
              >
                + Add all {allUnknownNames.length} to roster
              </Button>
            </div>
          )}
        </div>

        {editable.map((m, mi) => {
          const issues = m.played ? getMatchIssues(m) : [];
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
                <h5 className="font-semibold text-green-900 text-sm">
                  Match {m.matchNumber} {!m.played && <span className="text-xs font-normal text-gray-500">(Unplayed — skipped)</span>}
                </h5>
                {wins && (
                  <span className="text-sm font-bold text-green-900">
                    {wins.teamOne} - {wins.teamTwo}
                  </span>
                )}
              </div>

              {m.played && (m.fuzzyNotes.length > 0 || issues.length > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800 space-y-1.5">
                  {m.fuzzyNotes.map((r, i) => (
                    <p key={`f${i}`}>⚠️ {r}</p>
                  ))}
                  {issues.map((issue, i) => (
                    <div key={`p${i}`} className="flex flex-wrap items-center justify-between gap-2">
                      <span>⚠️ {issue.message}</span>
                      {issue.unknownName && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                          onClick={() => addNewPlayerToRoster(issue.unknownName!)}
                        >
                          + Add &quot;{issue.unknownName}&quot; as new player
                        </Button>
                      )}
                      {issue.ambiguous && (
                        <div className="flex flex-wrap gap-1">
                          {issue.ambiguous.candidates.map((cand) => (
                            <Button
                              key={cand}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                              onClick={() =>
                                replacePlayerNameInTeam(
                                  mi,
                                  issue.ambiguous!.teamKey,
                                  issue.ambiguous!.raw,
                                  cand
                                )
                              }
                            >
                              Use &quot;{cand}&quot;
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
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
