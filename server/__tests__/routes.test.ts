import { createServer } from "http";
import express from 'express';
import { registerRoutes } from '../routes';
import { jest } from '@jest/globals';

// Mock the database module
jest.mock('@db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

describe('API Routes', () => {
  let app: express.Express;
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    app = express();
    server = createServer(app); // Corrected server creation
    registerRoutes(app); // Apply routes after server creation
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.close();
  });

  describe('Players Endpoints', () => {
    test('GET /api/players returns players with stats', async () => {
      const mockPlayers = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ];

      const mockMatches = [
        {
          id: 1,
          teamOnePlayerOneId: 1,
          teamTwoPlayerOneId: 2,
          teamOneGamesWon: 2,
          teamTwoGamesWon: 1,
          date: new Date()
        }
      ];

      const { db } = require('@db');
      db.select.mockImplementation((table) => {
        if (!table) {
          return {
            from: jest.fn().mockResolvedValue(mockPlayers)
          };
        }
        return Promise.resolve(mockMatches);
      });

      const response = await new Promise<express.Response>((resolve) => {
        const req = express()
          .request({ method: 'GET', url: '/api/players' });
        app(req, <express.Response>{
          status: (code) => ({
            send: (data) => resolve({ status: code, body: data })
          })
        });
      });


      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    test('POST /api/players creates a new player', async () => {
      const newPlayer = { name: 'New Player', startYear: 2024 };
      const { db } = require('@db');
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 1, ...newPlayer }])
        })
      });

      const response = await new Promise<express.Response>((resolve) => {
        const req = express()
          .request({ method: 'POST', url: '/api/players' });
        app(req, <express.Response>{
          status: (code) => ({
            send: (data) => resolve({ status: code, body: data })
          })
        });
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(newPlayer);
    });
  });

  describe('Matches Endpoints', () => {
    test('POST /api/games creates a new match', async () => {
      const newMatch = {
        teamOnePlayerOneId: 1,
        teamTwoPlayerOneId: 2,
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1
      };

      const { db } = require('@db');
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 1, ...newMatch }])
        })
      });

      const response = await new Promise<express.Response>((resolve) => {
        const req = express()
          .request({ method: 'POST', url: '/api/games' });
        app(req, <express.Response>{
          status: (code) => ({
            send: (data) => resolve({ status: code, body: data })
          })
        });
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(newMatch);
    });
  });
});