import { PlayerStats, TeamSuggestion } from './types';

/**
 * OpenAI Decisions API (POST /v1/decisions, model gpt-6-luna) integration for
 * team suggestions.
 *
 * The deterministic balancer in team-balancer.ts enumerates candidate splits
 * and scores them by win-percentage differential. This module asks the
 * Decisions API to pick the most competitive, fair matchup from those
 * candidates with a single `choice` question, and returns the pick with its
 * confidence. Any failure (missing key, API error, refusal, unknown choice)
 * returns null so the caller falls back to the deterministic ordering.
 *
 * The installed `openai` SDK (v5) predates the Decisions endpoint, so this
 * calls the endpoint directly with fetch. When the SDK is upgraded to a
 * version with Decisions support, this can move to the client.
 */

const DECISIONS_ENDPOINT = 'https://api.openai.com/v1/decisions';
const DECISIONS_MODEL = 'gpt-6-luna';
const DECISIONS_TIMEOUT_MS = 10_000;

export interface DecisionPick {
  index: number;
  confidence: number;
}

function teamSummary(players: PlayerStats[]): string {
  const names = players.map((p) => p.name).join(', ');
  const avgWinPct =
    players.reduce((sum, p) => sum + (p.actualWinPercentage ?? p.winPercentage), 0) /
    players.length;
  const totalGames = players.reduce((sum, p) => sum + (p.record?.totalGames ?? 0), 0);
  return `${names} (avg win ${avgWinPct.toFixed(1)}%, ${totalGames} games played)`;
}

function scenarioDescription(s: TeamSuggestion): string {
  return (
    `Team 1: ${teamSummary(s.teamOne)} vs Team 2: ${teamSummary(s.teamTwo)}. ` +
    `Balance score ${s.balanceScore}/100, expected Team 1 win probability ${s.expectedWinProbability}%.`
  );
}

export async function pickBestTeamScenario(
  scenarios: TeamSuggestion[]
): Promise<DecisionPick | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || scenarios.length === 0) return null;

  const choices = scenarios.map((s, i) => ({
    value: `scenario-${i + 1}`,
    description: scenarioDescription(s),
  }));

  try {
    const response = await fetch(DECISIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DECISIONS_MODEL,
        input:
          "Wallyball league team matchup candidates for today's games. Pick the most competitive and fair matchup.",
        questions: [
          {
            type: 'choice',
            name: 'best_matchup',
            instructions:
              'Which team matchup is the most competitive and fair? Prefer matchups where both teams have similar overall strength and experience, so neither team is heavily favored.',
            choices,
          },
        ],
      }),
      signal: AbortSignal.timeout(DECISIONS_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`Decisions API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const answer = data?.answers?.[0];
    if (!answer || answer.type !== 'choice' || typeof answer.choice !== 'string') {
      return null;
    }

    const index = choices.findIndex((c) => c.value === answer.choice);
    if (index === -1) return null;

    return {
      index,
      confidence: typeof answer.confidence === 'number' ? answer.confidence : 0,
    };
  } catch (error) {
    console.error('Error calling Decisions API:', error);
    return null;
  }
}

/**
 * Reorders scenarios so the Decisions API pick comes first, annotating its
 * reasoning with the model's confidence. Pure function, no I/O.
 */
export function applyDecisionPick(
  scenarios: TeamSuggestion[],
  pick: DecisionPick
): TeamSuggestion[] {
  if (pick.index < 0 || pick.index >= scenarios.length) return scenarios;
  const chosen = scenarios[pick.index];
  const rest = scenarios.filter((_, i) => i !== pick.index);
  return [
    {
      ...chosen,
      reasoning:
        `${chosen.reasoning} Selected by the Decisions API as the most competitive matchup ` +
        `(confidence ${Math.round(pick.confidence * 100)}%).`,
    },
    ...rest,
  ];
}
