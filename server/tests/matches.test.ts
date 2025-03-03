/**
 * Unit tests for the matches API endpoints
 */
import request from 'supertest';
import { createTestApp, resetMocks } from './testUtils';
import { db } from '@db';
import { matches, players } from '@db/schema';

// Mock data for tests
const mockPlayers = [
  { id: 1, name: 'Test Player 1', startYear: 2020, createdAt: new Date('2020-01-01') },
  { id: 2, name: 'Test Player 2', startYear: 2021, createdAt: new Date('2021-01-01') },
  { id: 3, name: 'Test Player 3', startYear: 2022, createdAt: new Date('2022-01-01') }
];

const mockMatches = [
  {
    id: 1,
    teamOnePlayerOneId: 1,
    teamOnePlayerTwoId: 2,
    teamOnePlayerThreeId: null,
    teamTwoPlayerOneId: 3,
    teamTwoPlayerTwoId: null,
    teamTwoPlayerThreeId: null,
    teamOneGamesWon: 2,
    teamTwoGamesWon: 1,
    date: new Date('2023-01-15')
  }
];

describe('Matches API Endpoints', () => {
  const { app } = createTestApp();
  
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/matches', () => {
    it('should return all matches with player names', async () => {
      // Mock database responses
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockImplementation((table) => {
        if (table === matches) {
          return {
            from: db.from,
            then: (callback: Function) => Promise.resolve(callback(mockMatches))
          };
        } else if (table === players) {
          return {
            from: db.from,
            then: (callback: Function) => Promise.resolve(callback(mockPlayers))
          };
        }
        return db;
      });

      const response = await request(app).get('/api/matches');
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      
      // Check that player names are properly included
      expect(response.body[0].teamOnePlayers).toContain('Test Player 1');
      expect(response.body[0].teamOnePlayers).toContain('Test Player 2');
      expect(response.body[0].teamTwoPlayers).toContain('Test Player 3');
      
      // Verify db was called with correct parameters
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(db.from).toHaveBeenCalledWith(matches);
      expect(db.from).toHaveBeenCalledWith(players);
    });

    it('should return 500 when database query fails', async () => {
      // Mock database error
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/api/matches');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/games', () => {
    it('should create a new game record', async () => {
      const newGame = {
        teamOnePlayerOneId: 1,
        teamOnePlayerTwoId: 2,
        teamOnePlayerThreeId: null,
        teamTwoPlayerOneId: 3,
        teamTwoPlayerTwoId: null,
        teamTwoPlayerThreeId: null,
        teamOneGamesWon: 3,
        teamTwoGamesWon: 1,
        date: '2023-02-15'
      };
      
      const createdGame = { 
        ...newGame, 
        id: 2, 
        date: new Date('2023-02-15') 
      };
      
      // Mock insert operation
      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([createdGame]);

      const response = await request(app)
        .post('/api/games')
        .send(newGame);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(createdGame);
      
      // Verify db calls
      expect(db.insert).toHaveBeenCalledWith(matches);
      expect(db.values).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
    });

    it('should use current date when no date provided', async () => {
      const newGame = {
        teamOnePlayerOneId: 1,
        teamTwoPlayerOneId: 3,
        teamOneGamesWon: 2,
        teamTwoGamesWon: 2,
      };
      
      const createdGame = { 
        ...newGame, 
        id: 2,
        teamOnePlayerTwoId: null,
        teamOnePlayerThreeId: null,
        teamTwoPlayerTwoId: null,
        teamTwoPlayerThreeId: null,
        date: new Date()
      };
      
      // Mock insert operation
      jest.spyOn(global, 'Date').mockImplementation(() => createdGame.date as Date);
      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([createdGame]);

      const response = await request(app)
        .post('/api/games')
        .send(newGame);
      
      expect(response.status).toBe(200);
      expect(response.body.date).toEqual(createdGame.date);
      
      // Restore Date constructor
      (global.Date as any).mockRestore();
    });

    it('should return 500 when game creation fails', async () => {
      // Mock database error
      (db.insert as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .post('/api/games')
        .send({ 
          teamOnePlayerOneId: 1,
          teamTwoPlayerOneId: 2,
          teamOneGamesWon: 2,
          teamTwoGamesWon: 1
        });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/games/:id', () => {
    it('should delete a game record', async () => {
      const gameId = 1;
      
      // Mock delete operation
      (db.delete as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      
      const response = await request(app).delete(`/api/games/${gameId}`);
      
      expect(response.status).toBe(204);
      
      // Verify db calls
      expect(db.delete).toHaveBeenCalledWith(matches);
      expect(db.where).toHaveBeenCalled();
    });

    it('should return 500 when game deletion fails', async () => {
      // Mock database error
      (db.delete as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).delete('/api/games/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});