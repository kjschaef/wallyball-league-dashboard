/**
 * Unit tests for the performance trends API endpoints
 */
import request from 'supertest';
import { createTestApp, resetMocks } from './testUtils';
import { db } from '@db';
import { matches } from '@db/schema';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Mock data for tests
const mockMatches = [
  {
    id: 1,
    teamOnePlayerOneId: 1,
    teamOnePlayerTwoId: null,
    teamOnePlayerThreeId: null,
    teamTwoPlayerOneId: 2,
    teamTwoPlayerTwoId: null,
    teamTwoPlayerThreeId: null,
    teamOneGamesWon: 3,
    teamTwoGamesWon: 1,
    date: new Date('2023-01-15')
  },
  {
    id: 2,
    teamOnePlayerOneId: 1,
    teamOnePlayerTwoId: 3,
    teamOnePlayerThreeId: null,
    teamTwoPlayerOneId: 2,
    teamTwoPlayerTwoId: 4,
    teamTwoPlayerThreeId: null,
    teamOneGamesWon: 2,
    teamTwoGamesWon: 3,
    date: new Date('2023-01-22')
  }
];

// Mock date-fns functions
jest.mock('date-fns', () => ({
  startOfWeek: jest.fn(),
  endOfWeek: jest.fn(),
  startOfMonth: jest.fn(),
  endOfMonth: jest.fn(),
  subWeeks: jest.fn((date, weeks) => new Date(date.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)),
  subMonths: jest.fn((date, months) => new Date(date.getTime() - months * 30 * 24 * 60 * 60 * 1000)),
}));

describe('Performance Trends API Endpoints', () => {
  const { app } = createTestApp();
  
  beforeEach(() => {
    resetMocks();
    
    // Reset date-fns mocks with default implementations
    (startOfWeek as jest.Mock).mockImplementation(date => new Date(date));
    (endOfWeek as jest.Mock).mockImplementation(date => new Date(date));
    (startOfMonth as jest.Mock).mockImplementation(date => new Date(date));
    (endOfMonth as jest.Mock).mockImplementation(date => new Date(date));
  });

  describe('GET /api/trends', () => {
    it('should return weekly performance trends for all players', async () => {
      // Mock database response
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockImplementation(() => {
        return Promise.resolve(mockMatches);
      });

      const response = await request(app).get('/api/trends?period=weekly');
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(4); // 4 weeks of data
      
      // Check structure of response
      expect(response.body[0]).toHaveProperty('period');
      expect(response.body[0]).toHaveProperty('gamesWon');
      expect(response.body[0]).toHaveProperty('gamesLost');
      expect(response.body[0]).toHaveProperty('totalGames');
      expect(response.body[0]).toHaveProperty('winRate');
      
      // Verify db was called correctly
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalledWith(matches);
      expect(db.where).toHaveBeenCalledTimes(4); // Once per week
    });

    it('should return monthly performance trends for a specific player', async () => {
      // Mock database response
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockImplementation(() => {
        return Promise.resolve(mockMatches.filter(match => 
          match.teamOnePlayerOneId === 1 || 
          match.teamOnePlayerTwoId === 1 ||
          match.teamTwoPlayerOneId === 1 ||
          match.teamTwoPlayerTwoId === 1
        ));
      });

      const response = await request(app).get('/api/trends?period=monthly&playerId=1');
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3); // 3 months of data
      
      // Check structure of response
      expect(response.body[0]).toHaveProperty('period');
      expect(response.body[0]).toHaveProperty('gamesWon');
      expect(response.body[0]).toHaveProperty('gamesLost');
      expect(response.body[0]).toHaveProperty('totalGames');
      expect(response.body[0]).toHaveProperty('winRate');
      
      // Verify db was called correctly
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalledWith(matches);
      expect(db.where).toHaveBeenCalledTimes(3); // Once per month
    });

    it('should return 500 when trends query fails', async () => {
      // Mock database error
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/api/trends');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});