import { NextRequest } from 'next/server';
import { GET, POST } from '../../api/matches/route';
import { DELETE } from '../../api/matches/[id]/route';
import { getDb } from '../../lib/db';

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
      expect(data).toEqual(mockMatches);
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
      
      const request = new NextRequest('http://localhost:3000/api/matches', {
        method: 'POST',
        body: JSON.stringify(newMatch),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 1);
    });
  });

  describe('DELETE /api/matches/:id', () => {
    it('should delete a match', async () => {
      const mockDb = getDb();
      
      const params = { id: '1' };
      const request = new NextRequest('http://localhost:3000/api/matches/1', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params });
      
      expect(response.status).toBe(200);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
