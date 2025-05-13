import { GET, POST } from '../../api/players/route';
import { getDb } from '../../lib/db';

jest.mock('next/server', () => {
  const json = jest.fn().mockImplementation((data) => ({
    status: 200,
    json: async () => data,
  }));
  
  return {
    NextRequest: jest.fn().mockImplementation((url, options = {}) => ({
      url,
      method: options.method || 'GET',
      headers: new Map(Object.entries(options.headers || {})),
      json: async () => JSON.parse(options.body || '{}'),
    })),
    NextResponse: {
      json,
    },
  };
});

jest.mock('../../lib/db', () => ({
  getDb: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock('../../../db/schema', () => ({
  players: { id: 'id' },
  matches: { id: 'id' },
}));

describe('Players API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/players', () => {
    it('should return all players with stats', async () => {
      const mockPlayers = [
        { id: 1, name: 'Player 1', startYear: 2020, createdAt: '2020-01-01T00:00:00Z' },
        { id: 2, name: 'Player 2', startYear: 2021, createdAt: '2021-01-01T00:00:00Z' },
      ];
      
      const mockMatches = [
        { 
          id: 1, 
          date: '2025-04-01T00:00:00Z',
          teamOnePlayerOneId: 1,
          teamOneGamesWon: 3,
          teamTwoGamesWon: 1
        },
      ];
      
      const mockDb = getDb();
      const mockExecute = jest.fn();
      
      (mockDb.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          execute: mockExecute
        })
      });
      
      mockExecute.mockResolvedValueOnce(mockPlayers).mockResolvedValueOnce(mockMatches);
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeDefined();
    });
  });

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const mockDb = getDb();
      const mockReturning = jest.fn().mockResolvedValue([{ id: 3, name: 'New Player' }]);
      
      (mockDb.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: mockReturning
        })
      });
      
      const request = {
        json: jest.fn().mockResolvedValue({ name: 'New Player', startYear: 2023 }),
      };
      
      const response = await POST(request as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 3);
      expect(data).toHaveProperty('name', 'New Player');
    });
  });
});
