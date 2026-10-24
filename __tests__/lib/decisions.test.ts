import { pickBestTeamScenario, applyDecisionPick } from '../../app/lib/decisions';
import { PlayerStats, TeamSuggestion } from '../../app/lib/types';

function makePlayer(id: number, name: string, winPercentage: number): PlayerStats {
  return {
    id,
    name,
    yearsPlayed: 2,
    record: { wins: 5, losses: 5, totalGames: 10 },
    winPercentage,
    totalPlayingTime: 100,
  };
}

function makeScenario(
  label: string,
  teamOne: PlayerStats[],
  teamTwo: PlayerStats[],
  balanceScore: number
): TeamSuggestion {
  return {
    scenario: label,
    teamOne,
    teamTwo,
    balanceScore,
    expectedWinProbability: 50,
    reasoning: `${label} reasoning.`,
  };
}

const scenarios: TeamSuggestion[] = [
  makeScenario(
    'Most Balanced',
    [makePlayer(1, 'Alice', 60), makePlayer(2, 'Bob', 40)],
    [makePlayer(3, 'Charlie', 55), makePlayer(4, 'David', 45)],
    95
  ),
  makeScenario(
    'Alternative Balance',
    [makePlayer(1, 'Alice', 60), makePlayer(3, 'Charlie', 55)],
    [makePlayer(2, 'Bob', 40), makePlayer(4, 'David', 45)],
    88
  ),
  makeScenario(
    'Variation',
    [makePlayer(1, 'Alice', 60), makePlayer(4, 'David', 45)],
    [makePlayer(2, 'Bob', 40), makePlayer(3, 'Charlie', 55)],
    82
  ),
];

describe('pickBestTeamScenario', () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  const originalApiKey = process.env.OPENAI_API_KEY;
  let mockFetch: jest.Mock;
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockConsoleError = jest.fn();
    console.error = mockConsoleError;
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('returns the chosen scenario index and confidence, and posts a choice question', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        answers: [
          {
            type: 'choice',
            name: 'best_matchup',
            choice: 'scenario-2',
            confidence: 0.87,
            probabilities: [],
          },
        ],
      }),
    });

    const pick = await pickBestTeamScenario(scenarios);

    expect(pick).toEqual({ index: 1, confidence: 0.87 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/decisions');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('gpt-6-luna');
    expect(body.questions).toHaveLength(1);
    expect(body.questions[0].type).toBe('choice');
    expect(body.questions[0].name).toBe('best_matchup');
    expect(body.questions[0].choices.map((c: { value: string }) => c.value)).toEqual([
      'scenario-1',
      'scenario-2',
      'scenario-3',
    ]);
  });

  it('returns null on a non-OK response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    await expect(pickBestTeamScenario(scenarios)).resolves.toBeNull();
  });

  it('returns null without calling fetch when no API key is set', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(pickBestTeamScenario(scenarios)).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on a refusal answer', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ answers: [{ type: 'refusal', name: 'best_matchup' }] }),
    });

    await expect(pickBestTeamScenario(scenarios)).resolves.toBeNull();
  });

  it('returns null when the choice value matches no scenario', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        answers: [{ type: 'choice', name: 'best_matchup', choice: 'scenario-9', confidence: 0.5 }],
      }),
    });

    await expect(pickBestTeamScenario(scenarios)).resolves.toBeNull();
  });

  it('returns null for empty scenarios without calling fetch', async () => {
    await expect(pickBestTeamScenario([])).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('applyDecisionPick', () => {
  it('moves the picked scenario first and annotates its reasoning', () => {
    const result = applyDecisionPick(scenarios, { index: 1, confidence: 0.87 });

    expect(result).toHaveLength(3);
    expect(result[0].scenario).toBe('Alternative Balance');
    expect(result[0].reasoning).toContain('confidence 87%');
    expect(result[1].scenario).toBe('Most Balanced');
    expect(result[2].scenario).toBe('Variation');
    // Non-picked scenarios are unchanged
    expect(result[1].reasoning).toBe('Most Balanced reasoning.');
  });

  it('returns scenarios unchanged for an out-of-range pick', () => {
    expect(applyDecisionPick(scenarios, { index: 5, confidence: 0.9 })).toBe(scenarios);
  });
});
