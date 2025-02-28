import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../routes';

// Mock the database
jest.mock('../../db', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        }),
        execute: jest.fn().mockResolvedValue([
          { id: 1, name: 'Alice', createdAt: '2023-01-01' },
          { id: 2, name: 'Bob', createdAt: '2023-01-02' }
        ])
      })
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([{ id: 3, name: 'Charlie', createdAt: '2023-01-03' }])
        })
      })
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue({ count: 1 })
      })
    })
  }
}));

describe('API Routes', () => {
  let app: Express;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('GET /api/players', () => {
    test('returns list of players', async () => {
      const response = await request(app).get('/api/players');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, name: 'Alice', createdAt: '2023-01-01' },
        { id: 2, name: 'Bob', createdAt: '2023-01-02' }
      ]);
    });
  });

  describe('POST /api/players', () => {
    test('creates a new player', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({ name: 'Charlie' });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 3, name: 'Charlie', createdAt: '2023-01-03' });
    });

    test('validates request body', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({ invalidField: 'data' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/players/:id', () => {
    test('deletes a player', async () => {
      const response = await request(app).delete('/api/players/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });
});