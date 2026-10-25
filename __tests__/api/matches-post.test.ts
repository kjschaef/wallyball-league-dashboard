import { POST } from '@/app/api/matches/route';

// Mock the neon database connection
const mockSql = jest.fn();
const mockCookieStore = {
  get: jest.fn(),
};

// Create a mock function that handles template literals properly
const createMockSql = () => {
  return Object.assign(
    jest.fn().mockImplementation((strings: TemplateStringsArray, ..._values: unknown[]) => {
      const query = strings.join('');
      if (query.includes('SELECT id FROM players WHERE name = ANY')) {
        return mockSql('player-ids');
      } else if (query.includes('INSERT INTO match_games')) {
        return mockSql('insert_match_games');
      } else if (query.includes('INSERT INTO matches')) {
        return mockSql('insert');
      } else if (query.includes('SELECT * FROM players')) {
        return mockSql('players');
      }
      return mockSql('unknown');
    }),
    {
      transaction: jest.fn(),
      query: jest.fn().mockImplementation((queryStr: string) => {
        if (queryStr.includes('SELECT id FROM players WHERE name IN')) {
          return mockSql('player-ids');
        }
        return mockSql('unknown-query');
      }),
    }
  );
};

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => createMockSql()),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

// Mock Next.js environment
process.env.DATABASE_URL = 'mock-database-url';

describe('/api/matches POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookieStore.get.mockClear();
  });

  const createMockRequest = (bodyObj: Record<string, unknown>) => {
    return {
      json: async () => bodyObj,
    } as Request;
  };

  it('should return 401 Unauthorized if not admin', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const request = createMockRequest({});
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 Bad Request if missing player IDs on regular request', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    const request = createMockRequest({ teamOneGamesWon: 1, teamTwoGamesWon: 2 });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('At least one player per team is required');
  });

  it('should return 400 Bad Request if missing game scores on regular request', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    // Provide player IDs, but no game scores
    const request = createMockRequest({ teamOnePlayerOneId: 1, teamTwoPlayerOneId: 2 });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Game scores are required');
  });

  it('should return 201 Created and insert a regular match', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    const mockInsertedMatch = {
      id: 1,
      team_one_player_one_id: 1,
      team_one_player_two_id: 2,
      team_one_player_three_id: null,
      team_two_player_one_id: 3,
      team_two_player_two_id: null,
      team_two_player_three_id: null,
      team_one_games_won: 3,
      team_two_games_won: 1,
      date: '2023-01-01T12:00:00Z',
    };

    const mockPlayers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ];

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'insert') return Promise.resolve([mockInsertedMatch]);
      if (queryType === 'players') return Promise.resolve(mockPlayers);
      return Promise.resolve([]);
    });

    const request = createMockRequest({
      teamOnePlayerOneId: 1,
      teamOnePlayerTwoId: 2,
      teamTwoPlayerOneId: 3,
      teamOneGamesWon: 3,
      teamTwoGamesWon: 1,
      date: '2023-01-01'
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBe(1);
    expect(data.teamOnePlayers).toEqual(['Alice', 'Bob']);
    expect(data.teamTwoPlayers).toEqual(['Charlie']);
    expect(mockSql).toHaveBeenCalledWith('insert');
  });

  it('should handle matchNumber image analysis payload', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    const mockInsertedMatch = {
      id: 2,
      team_one_player_one_id: 1,
      team_one_player_two_id: null,
      team_one_player_three_id: null,
      team_two_player_one_id: 2,
      team_two_player_two_id: null,
      team_two_player_three_id: null,
      team_one_games_won: 2,
      team_two_games_won: 0,
      date: '2023-01-01T12:00:00Z',
    };

    const mockPlayers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'player-ids') return Promise.resolve([{ id: 1 }, { id: 2 }]);
      if (queryType === 'insert') return Promise.resolve([mockInsertedMatch]);
      if (queryType === 'players') return Promise.resolve(mockPlayers);
      return Promise.resolve([]);
    });

    const request = createMockRequest({
      matchNumber: 1,
      team1: { players: ['Alice'], wins: 2 },
      team2: { players: ['Bob'], wins: 0 },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe(2);
    expect(mockSql).toHaveBeenCalledWith('player-ids');
  });

  it('should return 500 on database error during POST', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    mockSql.mockRejectedValue(new Error('DB connection failed'));

    const request = createMockRequest({
      teamOnePlayerOneId: 1,
      teamTwoPlayerOneId: 2,
      teamOneGamesWon: 1,
      teamTwoGamesWon: 1,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it('should return 400 Bad Request if game scores contains a tie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    const request = createMockRequest({
      teamOnePlayerOneId: 1,
      teamTwoPlayerOneId: 2,
      gameScores: [
        { gameNumber: 1, teamOneScore: 11, teamTwoScore: 11 }
      ]
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('A game cannot end in a tie');
  });

  it('should return 400 Bad Request if game scores contains negative numbers', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    const request = createMockRequest({
      teamOnePlayerOneId: 1,
      teamTwoPlayerOneId: 2,
      gameScores: [
        { gameNumber: 1, teamOneScore: -1, teamTwoScore: 11 }
      ]
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('scores must be non-negative numbers');
  });

  it('should insert match_games and auto-compute games won when gameScores are provided', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'true' });

    const mockInsertedMatch = {
      id: 10,
      team_one_player_one_id: 1,
      team_one_player_two_id: null,
      team_one_player_three_id: null,
      team_two_player_one_id: 2,
      team_two_player_two_id: null,
      team_two_player_three_id: null,
      team_one_games_won: 2,
      team_two_games_won: 1,
      date: '2023-01-01T12:00:00Z',
    };

    const mockPlayers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];

    mockSql.mockImplementation((queryType) => {
      if (queryType === 'insert') return Promise.resolve([mockInsertedMatch]);
      if (queryType === 'insert_match_games') return Promise.resolve([]);
      if (queryType === 'players') return Promise.resolve(mockPlayers);
      return Promise.resolve([]);
    });

    const request = createMockRequest({
      teamOnePlayerOneId: 1,
      teamTwoPlayerOneId: 2,
      date: '2023-01-01',
      gameScores: [
        { gameNumber: 1, teamOneScore: 11, teamTwoScore: 8 },
        { gameNumber: 2, teamOneScore: 9, teamTwoScore: 11 },
        { gameNumber: 3, teamOneScore: 11, teamTwoScore: 4 }
      ]
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.teamOneGamesWon).toBe(2);
    expect(data.teamTwoGamesWon).toBe(1);
    expect(data.gameScores).toHaveLength(3);
    expect(data.gameScores[0]).toEqual({ gameNumber: 1, teamOneScore: 11, teamTwoScore: 8 });
    expect(mockSql).toHaveBeenCalledWith('insert_match_games');
  });
});
