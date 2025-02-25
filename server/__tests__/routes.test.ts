
import { describe, expect, jest, test } from '@jest/globals';
import { Request, Response } from 'express';
import express from 'express';
import { db } from '@db';
import { registerRoutes } from '../routes';

jest.mock('@db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('API Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    registerRoutes(app);
  });

  const mockPlayers = [
    { id: 1, name: 'Player 1', startYear: 2024 },
    { id: 2, name: 'Player 2', startYear: 2024 }
  ];

  describe('Players Endpoints', () => {
    test('GET /api/players should return players array', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as Partial<Response>;

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue(mockPlayers)
      });

      await app._router.handle(mockReq, mockRes as Response, () => {});

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.arrayContaining(mockPlayers));
    });

    test('POST /api/players should create a new player', async () => {
      const newPlayer = { name: 'New Player', startYear: 2024 };
      const mockReq = {
        body: newPlayer
      } as Request;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as Partial<Response>;

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1, ...newPlayer }])
      });

      await app._router.handle(mockReq, mockRes as Response, () => {});

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(newPlayer));
    });
  });

  describe('Matches Endpoints', () => {
    test('POST /api/games should create a new match', async () => {
      const newMatch = {
        teamOnePlayerOneId: 1,
        teamTwoPlayerOneId: 2,
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1
      };
      const mockReq = {
        body: newMatch
      } as Request;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as Partial<Response>;

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1, ...newMatch }])
      });

      await app._router.handle(mockReq, mockRes as Response, () => {});

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(newMatch));
    });
  });
});
