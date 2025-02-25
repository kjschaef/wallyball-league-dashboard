
import { describe, expect, jest, test } from '@jest/globals';
import { Request, Response } from 'express';
import express from 'express';
import { db } from '@db';
import { registerRoutes } from '../routes';
import { Player, Match } from '@db/schema';

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
    jest.clearAllMocks();
  });

  describe('Players Endpoints', () => {
    test('GET /api/players should return players array', async () => {
      const mockPlayers = [
        { id: 1, name: 'Player 1', startYear: 2024 },
        { id: 2, name: 'Player 2', startYear: 2024 }
      ];

      const mockReq = {
        method: 'GET',
        url: '/api/players',
        path: '/api/players'
      } as Request;

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as Partial<Response>;

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue(mockPlayers as Player[])
      });

      const route = app._router.stack
        .filter((layer: any) => layer.route)
        .find((layer: any) => 
          layer.route.path === '/api/players' && 
          layer.route.stack[0].method === 'get'
        );
      
      await route.handle(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.arrayContaining(mockPlayers));
    });

    test('POST /api/players should create a new player', async () => {
      const newPlayer = { name: 'New Player', startYear: 2024 };
      const mockReq = {
        method: 'POST',
        url: '/api/players',
        path: '/api/players',
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

      const route = app._router.stack
        .filter((layer: any) => layer.route)
        .find((layer: any) => 
          layer.route.path === '/api/players' && 
          layer.route.stack[0].method === 'post'
        );
      
      await route.handle(mockReq, mockRes as Response);

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
        method: 'POST',
        url: '/api/games',
        path: '/api/games',
        body: newMatch
      } as Request;

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as Partial<Response>;

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1, ...newMatch, date: new Date() }])
      });

      const route = app._router.stack
        .filter((layer: any) => layer.route)
        .find((layer: any) => 
          layer.route.path === '/api/games' && 
          layer.route.stack[0].method === 'post'
        );
      
      await route.handle(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ ...newMatch })
      );
    });
  });
});
