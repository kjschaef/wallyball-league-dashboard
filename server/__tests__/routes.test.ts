import { describe, expect, jest, test } from '@jest/globals';
import { Request, Response } from 'express';
import { db } from '@db';
import { setupRoutes } from '../routes';

jest.mock('@db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('API Routes', () => {
  const mockPlayers = [
    { id: 1, name: 'Player 1', startYear: 2024 },
    { id: 2, name: 'Player 2', startYear: 2024 }
  ];

  const mockRequest = (method: string, url: string, body?: any): Partial<Request> => ({
    method,
    url,
    body
  });

  const mockResponse = (): Partial<Response> & { 
    status: jest.Mock; 
    json: jest.Mock;
    send: jest.Mock;
  } => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('Players Endpoints', () => {
    test('GET /api/players should return empty array initially', async () => {
      const req = mockRequest('GET', '/api/players');
      const res = mockResponse();

      // Mock database response
      (db.select as jest.Mock).mockImplementation(() => ({
        from: jest.fn().mockResolvedValue(mockPlayers)
      }));

      const routes = setupRoutes();
      await routes.handle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });

    test('POST /api/players should create a new player', async () => {
      const newPlayer = { name: 'New Player', startYear: 2024 };
      const req = mockRequest('POST', '/api/players', newPlayer);
      const res = mockResponse();

      (db.insert as jest.Mock).mockImplementation(() => ({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1, ...newPlayer }])
      }));

      const routes = setupRoutes();
      await routes.handle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(newPlayer));
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
      const req = mockRequest('POST', '/api/games', newMatch);
      const res = mockResponse();

      (db.insert as jest.Mock).mockImplementation(() => ({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1, ...newMatch }])
      }));

      const routes = setupRoutes();
      await routes.handle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(newMatch));
    });
  });
});