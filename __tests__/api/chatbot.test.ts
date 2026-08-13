import { NextRequest } from 'next/server';
import { POST, GET } from '../../app/api/chatbot/route';

const mockAnalyzePlayerPerformance = jest.fn();
const mockSuggestTeamMatchups = jest.fn();
const mockQueryWallyballRules = jest.fn();
const mockDetectIntent = jest.fn();

jest.mock('@/app/lib/openai', () => ({
  analyzePlayerPerformance: (...args: unknown[]) => mockAnalyzePlayerPerformance(...args),
  suggestTeamMatchups: (...args: unknown[]) => mockSuggestTeamMatchups(...args),
  queryWallyballRules: (...args: unknown[]) => mockQueryWallyballRules(...args),
  detectIntent: (...args: unknown[]) => mockDetectIntent(...args),
}));

const mockLifetimePlayerStats = [
  { id: 1, name: 'Alice', winPercentage: 60, record: { wins: 6, losses: 4, totalGames: 10 } },
  { id: 2, name: 'Bob', winPercentage: 40, record: { wins: 4, losses: 6, totalGames: 10 } },
  { id: 3, name: 'Charlie', winPercentage: 55, record: { wins: 5, losses: 5, totalGames: 10 } },
  { id: 4, name: 'David', winPercentage: 45, record: { wins: 4, losses: 6, totalGames: 10 } }
];

const mockCurrentPlayerStats = [
  { id: 1, name: 'Alice', winPercentage: 70, record: { wins: 7, losses: 3, totalGames: 10 } },
  { id: 2, name: 'Bob', winPercentage: 30, record: { wins: 3, losses: 7, totalGames: 10 } },
  { id: 3, name: 'Charlie', winPercentage: 60, record: { wins: 6, losses: 4, totalGames: 10 } },
  { id: 4, name: 'David', winPercentage: 40, record: { wins: 4, losses: 6, totalGames: 10 } }
];

// Helper to create a NextRequest mock
const createMockRequest = (body: any, rejectJson = false) => {
  return {
    json: jest.fn().mockImplementation(() => {
      if (rejectJson) {
        return Promise.reject(new Error('Invalid JSON'));
      }
      return Promise.resolve(body);
    }),
  } as unknown as NextRequest;
};

describe('POST /api/chatbot', () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError = jest.fn();
    console.error = mockConsoleError;

    // Default mock for internal API stats fetch
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/player-stats')) {
        if (url.includes('season=current')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockCurrentPlayerStats,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockLifetimePlayerStats,
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found',
      });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it('returns 400 Bad Request when message is missing or empty', async () => {
    const request = createMockRequest({
      message: '   '
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Message is required' });
  });

  it('returns custom message when playerStats database is empty', async () => {
    // Mock empty stats from internal API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const request = createMockRequest({
      message: 'Hello assistant'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('error');
    expect(data.response).toContain("I don't have access to any player data right now");
  });

  it('detects rules_query intent and queries wallyball rules', async () => {
    mockDetectIntent.mockResolvedValue('rules_query');
    mockQueryWallyballRules.mockResolvedValue({
      response: 'The serving rules of wallyball state...',
      usedRules: true
    });

    const request = createMockRequest({
      message: 'What are the rules of serving?'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('rules_query');
    expect(data.response).toBe('The serving rules of wallyball state...');
    expect(data.additionalData).toEqual({ usedRules: true });
    expect(mockQueryWallyballRules).toHaveBeenCalledWith('What are the rules of serving?');
  });

  it('detects general/performance intent and analyzes player performance', async () => {
    mockDetectIntent.mockResolvedValue('performance_analysis');
    mockAnalyzePlayerPerformance.mockResolvedValue({
      response: 'Alice has a higher win rate this season...',
      usedRules: false
    });

    const request = createMockRequest({
      message: 'Compare Alice and Bob'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('performance_analysis');
    expect(data.response).toBe('Alice has a higher win rate this season...');
    expect(data.additionalData).toEqual({ usedRules: false });
    expect(mockAnalyzePlayerPerformance).toHaveBeenCalledWith(
      mockLifetimePlayerStats,
      mockCurrentPlayerStats,
      'Compare Alice and Bob'
    );
  });

  it('supports explicit context-based team suggestion when keywords match', async () => {
    mockSuggestTeamMatchups.mockReturnValue([
      {
        scenario: 'Matchup 1',
        teamOne: [mockLifetimePlayerStats[0], mockLifetimePlayerStats[2]],
        teamTwo: [mockLifetimePlayerStats[1], mockLifetimePlayerStats[3]],
        balanceScore: 90,
        expectedWinProbability: 55,
        reasoning: 'Balanced teams based on win percentage.'
      }
    ]);

    const request = createMockRequest({
      message: 'suggest balanced teams for today',
      context: {
        type: 'team_suggestion',
        players: [1, 2, 3, 4]
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('team_suggestion');
    expect(data.response).toContain('Matchup 1');
    expect(data.response).toContain('Alice');
    expect(data.response).toContain('Bob');
    expect(mockSuggestTeamMatchups).toHaveBeenCalledWith(mockLifetimePlayerStats);
  });

  it('returns error message if there are less than 4 players for team suggestions', async () => {
    const request = createMockRequest({
      message: 'suggest balanced teams',
      context: {
        type: 'team_suggestion',
        players: [1] // only 1 player available
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('error');
    expect(data.response).toContain('I need at least 4 players to suggest balanced teams');
  });

  it('returns 500 Internal Server Error when fetching player stats fails', async () => {
    // Mock fetch error
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection failed'));

    const request = createMockRequest({
      message: 'Hello'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process chat message');
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('returns 500 and handles unexpected execution errors inside handler', async () => {
    mockDetectIntent.mockRejectedValue(new Error('OpenAI quota exceeded'));

    const request = createMockRequest({
      message: 'Hello'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process chat message');
    expect(mockConsoleError).toHaveBeenCalled();
  });
});

describe('GET /api/chatbot', () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    mockConsoleError = jest.fn();
    console.error = mockConsoleError;

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/player-stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLifetimePlayerStats,
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it('returns ready status and chatbot capabilities successfully', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ready');
    expect(data.playerCount).toBe(4);
    expect(data.capabilities).toContain('Player performance analysis');
    expect(data.capabilities).toContain('Official Wallyball rules queries');
  });

  it('returns 500 Internal Server Error when fetch player stats fails in GET', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('DB is down'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to get chatbot status');
    expect(mockConsoleError).toHaveBeenCalled();
  });
});
