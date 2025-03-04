import express from 'express';
import request from 'supertest';
import { registerRoutes } from './routes';
import { players } from '../db/schema';
import { mockDb } from './__mocks__/db';
import { eq } from 'drizzle-orm';

// Mock the entire db module
jest.mock('../db', () => ({
  db: mockDb
}));

describe('API Routes', () => {
  let app: express.Application;
  let server: any;

  beforeAll(() => {
    app = express();
    server = registerRoutes(app);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/players', () => {
    it('should return a list of players', async () => {
      const mockPlayers = [
        { id: 1, name: 'John', startYear: 2023, createdAt: new Date() },
        { id: 2, name: 'Jane', startYear: 2022, createdAt: new Date() }
      ];
      
      // Setup mock response
      mockDb.select.mockResolvedValue(mockPlayers);
      
      const response = await request(app).get('/api/players');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlayers);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('GET /api/players/:id', () => {
    it('should return a single player by ID', async () => {
      const mockPlayer = { id: 1, name: 'John', startYear: 2023, createdAt: new Date() };
      
      // Setup mock response
      mockDb.select.mockResolvedValue([mockPlayer]);
      
      const response = await request(app).get('/api/players/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlayer);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalledWith(eq(players.id, 1));
    });

    it('should return 404 for non-existent player', async () => {
      // Setup mock response for empty result
      mockDb.select.mockResolvedValue([]);
      
      const response = await request(app).get('/api/players/999');
      
      expect(response.status).toBe(404);
    });
  });
});