import { GET, POST } from '../../api/matches/route';
import { DELETE } from '../../api/matches/[id]/route';
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
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  }),
}));

jest.mock('../../../db/schema', () => ({
  matches: { id: 'id' },
  players: { id: 'id' },
  eq: jest.fn(),
}));

describe('Matches API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/matches', () => {
    it('should return all matches', async () => {
      const mockMatches = [
        { 
          id: 1, 
          date: '2025-04-01T00:00:00Z',
          teamOnePlayerOneId: 1,
          teamOnePlayerTwoId: 2,
          teamOnePlayerThreeId: null,
          teamTwoPlayerOneId: 3,
          teamTwoPlayerTwoId: 4,
          teamTwoPlayerThreeId: null,
          teamOneGamesWon: 3,
          teamTwoGamesWon: 1
        },
      ];
      
      const mockDb = getDb();
      const mockExecute = jest.fn().mockResolvedValue(mockMatches);
      
      (mockDb.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          execute: mockExecute
        })
      });
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeDefined();
    });
  });

  describe('POST /api/matches', () => {
    it('should create a new match', async () => {
      const newMatch = { 
        date: '2025-04-01T00:00:00Z',
        teamOnePlayerOneId: 1,
        teamOnePlayerTwoId: 2,
        teamOnePlayerThreeId: null,
        teamTwoPlayerOneId: 3,
        teamTwoPlayerTwoId: 4,
        teamTwoPlayerThreeId: null,
        teamOneGamesWon: 3,
        teamTwoGamesWon: 1
      };
      
      const mockDb = getDb();
      const mockReturning = jest.fn().mockResolvedValue([{ id: 1, ...newMatch }]);
      
      (mockDb.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: mockReturning
        })
      });
      
      const request = {
        json: jest.fn().mockResolvedValue(newMatch),
      };
      
      const response = await POST(request as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 1);
    });
  });

  describe('DELETE /api/matches/:id', () => {
    it('should delete a match', async () => {
      const mockDb = getDb();
      
      const params = { id: '1' };
      const request = {};
      
      const response = await DELETE(request as any, { params });
      
      expect(response.status).toBe(200);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
