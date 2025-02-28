import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../routes';
import { Player, Match, getMockData, configureMockDb, db } from './setup';

describe('API Routes', () => {
  let app: Express;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('GET /api/players', () => {
    it('returns list of players', async () => {
      // Setup mock data
      configureMockDb({ 
        selectResults: getMockData.players 
      });

      // Execute request
      const response = await request(app).get('/api/players');
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    });
  });

  describe('POST /api/players', () => {
    it('creates a new player', async () => {
      // Define new player data
      const newPlayer: Partial<Player> = { 
        name: 'Charlie',
        startYear: 2022
      };
      
      // Setup mock
      const createdPlayer = { 
        id: 3, 
        ...newPlayer, 
        createdAt: new Date('2023-01-03') 
      } as Player;
      
      configureMockDb({ 
        insertResults: [createdPlayer] 
      });

      // Execute request
      const response = await request(app)
        .post('/api/players')
        .send(newPlayer);
      
      // Verify response
      expect(response.status).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('handles invalid request body', async () => {
      // Execute request with invalid data
      const response = await request(app)
        .post('/api/players')
        .send({ invalidField: 'data' });
      
      // Validation should fail with 400 or similar error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('deletes a player', async () => {
      // Setup mock
      configureMockDb({ 
        deleteResults: { rowCount: 1 } 
      });

      // Execute request
      const response = await request(app).delete('/api/players/1');
      
      // Should return a success status code
      expect(response.status).toBeLessThan(300);
    });
  });

  describe('GET /api/matches', () => {
    it('returns list of matches', async () => {
      // Setup mock
      configureMockDb({ 
        selectResults: getMockData.matches 
      });

      // Execute request
      const response = await request(app).get('/api/matches');
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    });
  });
});