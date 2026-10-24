/**
 * @jest-environment node
 */
import {
  askChoice,
  askPredicate,
  classifyChatIntent,
  queryReferencesRules,
  isAbusiveOrSpam,
  resolveAmbiguousInitial,
  checkMatchDuplicate,
  checkMatchAnomaly,
} from '../../app/lib/decisions';

const ORIGINAL_KEY = process.env.OPENAI_API_KEY;

function mockDecisionsAnswer(answer: unknown, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ answers: [answer] }),
  });
}

function mockDecisionsAnswers(answers: unknown[]) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ answers }),
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  process.env.OPENAI_API_KEY = 'test-key';
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = ORIGINAL_KEY;
  }
});

describe('askChoice', () => {
  it('maps a valid choice answer to choice + confidence', async () => {
    mockDecisionsAnswer({
      type: 'choice',
      choice: 'rules_query',
      confidence: 0.92,
    });
    const result = await askChoice('msg', 'q', 'pick one', [
      { value: 'rules_query', description: 'rules' },
      { value: 'general_chat', description: 'chat' },
    ]);
    expect(result).toEqual({ choice: 'rules_query', confidence: 0.92 });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/decisions');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('gpt-6-luna');
    expect(body.questions[0].type).toBe('choice');
    expect(init.headers.Authorization).toBe('Bearer test-key');
  });

  it('returns null for an unknown choice value', async () => {
    mockDecisionsAnswer({ type: 'choice', choice: 'nope', confidence: 0.9 });
    await expect(
      askChoice('msg', 'q', 'pick one', [{ value: 'a', description: 'A' }])
    ).resolves.toBeNull();
  });

  it('returns null on a non-OK response', async () => {
    mockDecisionsAnswer(null, false);
    await expect(
      askChoice('msg', 'q', 'pick one', [{ value: 'a', description: 'A' }])
    ).resolves.toBeNull();
  });

  it('returns null without an API key and never calls fetch', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(
      askChoice('msg', 'q', 'pick one', [{ value: 'a', description: 'A' }])
    ).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null for a malformed answers payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ answers: 'not-an-array' }),
    });
    await expect(
      askChoice('msg', 'q', 'pick one', [{ value: 'a', description: 'A' }])
    ).resolves.toBeNull();
  });
});

describe('askPredicate', () => {
  it('passes through a numeric probability', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.73 });
    await expect(askPredicate('msg', 'q', 'is it?')).resolves.toEqual({
      probability: 0.73,
    });
  });

  it('maps a yes/no choice value to 1/0', async () => {
    mockDecisionsAnswer({ type: 'predicate', choice: 'yes' });
    await expect(askPredicate('msg', 'q', 'is it?')).resolves.toEqual({
      probability: 1,
    });
    mockDecisionsAnswer({ type: 'predicate', choice: 'no' });
    await expect(askPredicate('msg', 'q', 'is it?')).resolves.toEqual({
      probability: 0,
    });
  });

  it('returns null when the answer has no usable value', async () => {
    mockDecisionsAnswer({ type: 'predicate' });
    await expect(askPredicate('msg', 'q', 'is it?')).resolves.toBeNull();
  });
});

describe('classifyChatIntent', () => {
  it('returns a high-confidence choice', async () => {
    mockDecisionsAnswer({
      type: 'choice',
      choice: 'rules_query',
      confidence: 0.9,
    });
    await expect(classifyChatIntent('What are the rules?')).resolves.toBe(
      'rules_query'
    );
  });

  it('falls back to performance_analysis on low confidence', async () => {
    mockDecisionsAnswer({
      type: 'choice',
      choice: 'general_chat',
      confidence: 0.3,
    });
    await expect(classifyChatIntent('hello')).resolves.toBe(
      'performance_analysis'
    );
  });

  it('falls back to performance_analysis on API failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    await expect(classifyChatIntent('hello')).resolves.toBe(
      'performance_analysis'
    );
  });
});

describe('queryReferencesRules', () => {
  it('returns true at or above the threshold', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.5 });
    await expect(queryReferencesRules('rules question')).resolves.toBe(true);
  });

  it('returns false below the threshold and on failure', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.49 });
    await expect(queryReferencesRules('rules question')).resolves.toBe(false);
    mockDecisionsAnswer(null, false);
    await expect(queryReferencesRules('rules question')).resolves.toBe(false);
  });
});

describe('isAbusiveOrSpam', () => {
  it('refuses only at high probability', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.8 });
    await expect(isAbusiveOrSpam('junk')).resolves.toBe(true);
    mockDecisionsAnswer({ type: 'predicate', probability: 0.79 });
    await expect(isAbusiveOrSpam('junk')).resolves.toBe(false);
  });

  it('fails open on API failure', async () => {
    mockDecisionsAnswer(null, false);
    await expect(isAbusiveOrSpam('junk')).resolves.toBe(false);
  });
});

describe('resolveAmbiguousInitial', () => {
  it('returns null without calling the API when signup evidence does not discriminate', async () => {
    await expect(
      resolveAmbiguousInitial(
        'P',
        [
          { name: 'Paul', signedUpToday: true },
          { name: 'Parker', signedUpToday: true },
        ],
        []
      )
    ).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    await expect(
      resolveAmbiguousInitial(
        'P',
        [
          { name: 'Paul', signedUpToday: false },
          { name: 'Parker', signedUpToday: false },
        ],
        []
      )
    ).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('resolves when the signed-up candidate is picked with high confidence', async () => {
    mockDecisionsAnswer({ type: 'choice', choice: 'Paul', confidence: 0.85 });
    await expect(
      resolveAmbiguousInitial(
        'P',
        [
          { name: 'Paul', signedUpToday: true },
          { name: 'Parker', signedUpToday: false },
        ],
        ['Alice', 'Bob']
      )
    ).resolves.toEqual({ name: 'Paul', confidence: 0.85 });
  });

  it('returns null when the model picks the non-signed-up candidate', async () => {
    mockDecisionsAnswer({ type: 'choice', choice: 'Parker', confidence: 0.9 });
    await expect(
      resolveAmbiguousInitial(
        'P',
        [
          { name: 'Paul', signedUpToday: true },
          { name: 'Parker', signedUpToday: false },
        ],
        []
      )
    ).resolves.toBeNull();
  });

  it('returns null on low confidence even for the signed-up candidate', async () => {
    mockDecisionsAnswer({ type: 'choice', choice: 'Paul', confidence: 0.6 });
    await expect(
      resolveAmbiguousInitial(
        'P',
        [
          { name: 'Paul', signedUpToday: true },
          { name: 'Parker', signedUpToday: false },
        ],
        []
      )
    ).resolves.toBeNull();
  });
});

describe('checkMatchDuplicate', () => {
  const recent = [
    {
      id: 7,
      teamOne: ['Alice', 'Bob'],
      teamTwo: ['Carol', 'Dan'],
      teamOneGamesWon: 2,
      teamTwoGamesWon: 1,
      date: '2026-10-24',
    },
    {
      id: 8,
      teamOne: ['Eve', 'Frank'],
      teamTwo: ['Grace', 'Heidi'],
      teamOneGamesWon: 2,
      teamTwoGamesWon: 0,
      date: '2026-10-24',
    },
  ];

  it('returns null without calling the API when there is nothing recent', async () => {
    await expect(
      checkMatchDuplicate(
        {
          teamOne: ['Alice', 'Bob'],
          teamTwo: ['Carol', 'Dan'],
          teamOneGamesWon: 2,
          teamTwoGamesWon: 1,
          date: '2026-10-24',
        },
        []
      )
    ).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('identifies the same-teams same-line match as the suspected duplicate', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.93 });
    await expect(
      checkMatchDuplicate(
        {
          teamOne: ['Bob', 'Alice'],
          teamTwo: ['Carol', 'Dan'],
          teamOneGamesWon: 2,
          teamTwoGamesWon: 1,
          date: '2026-10-24',
        },
        recent
      )
    ).resolves.toEqual({ duplicateId: 7, probability: 0.93 });
  });

  it('returns null below the duplicate threshold', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.5 });
    await expect(
      checkMatchDuplicate(
        {
          teamOne: ['Alice', 'Bob'],
          teamTwo: ['Carol', 'Dan'],
          teamOneGamesWon: 2,
          teamTwoGamesWon: 1,
          date: '2026-10-24',
        },
        recent
      )
    ).resolves.toBeNull();
  });
});

describe('checkMatchAnomaly', () => {
  const match = {
    teamOne: ['Alice', 'Bob'],
    teamTwo: ['Carol', 'Dan'],
    teamOneGamesWon: 2,
    teamTwoGamesWon: 1,
    date: '2026-10-24',
  };

  it('returns the probability at or above the threshold', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.9 });
    await expect(checkMatchAnomaly(match)).resolves.toEqual({
      probability: 0.9,
    });
  });

  it('returns null below the threshold', async () => {
    mockDecisionsAnswer({ type: 'predicate', probability: 0.4 });
    await expect(checkMatchAnomaly(match)).resolves.toBeNull();
  });
});

describe('request shape', () => {
  it('sends predicate questions with instructions', async () => {
    mockDecisionsAnswers([{ type: 'predicate', probability: 0.9 }]);
    await isAbusiveOrSpam('test');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.questions[0].type).toBe('predicate');
    expect(typeof body.questions[0].instructions).toBe('string');
    expect(typeof body.input).toBe('string');
  });
});
