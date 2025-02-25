import { describe, expect, test, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import { players, matches } from '../db/schema';

// Mock the database
jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

describe("API Routes", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  test("GET /api/players returns players with stats", async () => {
    const mockPlayers = [
      { id: 1, name: "Player 1" },
      { id: 2, name: "Player 2" }
    ];

    const mockMatches = [
      { 
        id: 1,
        teamOnePlayerOneId: 1,
        teamTwoPlayerOneId: 2,
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1
      }
    ];

    // Mock database responses
    const db = require('../db').db;
    db.select.mockImplementation((table) => {
      if (table === players) return Promise.resolve(mockPlayers);
      if (table === matches) return Promise.resolve(mockMatches);
      return Promise.resolve([]);
    });

    await require('../routes').getPlayers(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalled();
    const response = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(response).toHaveLength(2);
    expect(response[0]).toHaveProperty('stats');
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