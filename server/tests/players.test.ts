/**
 * Unit tests for the player API endpoints
 */
import request from 'supertest';
import { createTestApp, resetMocks } from './testUtils';
import { db } from '@db';
import { players, matches } from '@db/schema';

// Mock data for tests
const mockPlayers = [
  { id: 1, name: 'Test Player 1', startYear: 2020, createdAt: new Date('2020-01-01') },
  { id: 2, name: 'Test Player 2', startYear: 2021, createdAt: new Date('2021-01-01') }
];

const mockMatches = [
  {
    id: 1,
    teamOnePlayerOneId: 1,
    teamOnePlayerTwoId: null,
    teamOnePlayerThreeId: null,
    teamTwoPlayerOneId: 2,
    teamTwoPlayerTwoId: null,
    teamTwoPlayerThreeId: null,
    teamOneGamesWon: 2,
    teamTwoGamesWon: 1,
    date: new Date('2023-01-15')
  }
];

describe('Player API Endpoints', () => {
  const { app } = createTestApp();
  
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/players', () => {
    it('should return all players with their stats', async () => {
      // Mock database responses
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockImplementation((table) => {
        if (table === players) {
          return {
            from: db.from,
            then: (callback: Function) => Promise.resolve(callback(mockPlayers))
          };
        } else if (table === matches) {
          return {
            from: db.from,
            then: (callback: Function) => Promise.resolve(callback(mockMatches))
          };
        }
        return db;
      });

      const response = await request(app).get('/api/players');
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('matches');
      expect(response.body[0]).toHaveProperty('stats');

      // Player 1 should have stats showing games won
      const player1 = response.body.find((p: any) => p.id === 1);
      expect(player1.stats.won).toBe(2); // From team one games won
      
      // Verify db was called with correct parameters
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(db.from).toHaveBeenCalledWith(players);
      expect(db.from).toHaveBeenCalledWith(matches);
    });

    it('should return 500 when database query fails', async () => {
      // Mock database error
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/api/players');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const newPlayer = { name: 'New Player', startYear: 2023 };
      const createdPlayer = { ...newPlayer, id: 3, createdAt: new Date() };
      
      // Mock insert operation
      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([createdPlayer]);

      const response = await request(app)
        .post('/api/players')
        .send(newPlayer);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(createdPlayer);
      
      // Verify db calls
      expect(db.insert).toHaveBeenCalledWith(players);
      expect(db.values).toHaveBeenCalledWith(newPlayer);
      expect(db.returning).toHaveBeenCalled();
    });

    it('should return 500 when player creation fails', async () => {
      // Mock database error
      (db.insert as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .post('/api/players')
        .send({ name: 'Test Player' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/players/:id', () => {
    it('should update a player', async () => {
      const playerId = 1;
      const updateData = { name: 'Updated Name', startYear: 2022 };
      const updatedPlayer = { id: playerId, ...updateData, createdAt: new Date() };
      
      // Mock update operation
      (db.update as jest.Mock).mockReturnThis();
      (db.set as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([updatedPlayer]);

      const response = await request(app)
        .put(`/api/players/${playerId}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedPlayer);
      
      // Verify db calls
      expect(db.update).toHaveBeenCalledWith(players);
      expect(db.set).toHaveBeenCalledWith(updateData);
      expect(db.where).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
    });

    it('should return 404 when player is not found', async () => {
      // Mock empty result (player not found)
      (db.update as jest.Mock).mockReturnThis();
      (db.set as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .put('/api/players/999')
        .send({ name: 'Not Found Player' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('should delete a player and associated matches', async () => {
      const playerId = 1;
      
      // Mock delete operations
      (db.delete as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      
      const response = await request(app).delete(`/api/players/${playerId}`);
      
      expect(response.status).toBe(204);
      
      // Verify db calls - should delete matches first, then player
      expect(db.delete).toHaveBeenCalledWith(matches);
      expect(db.delete).toHaveBeenCalledWith(players);
    });

    it('should return 500 when player deletion fails', async () => {
      // Mock database error
      (db.delete as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).delete('/api/players/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});