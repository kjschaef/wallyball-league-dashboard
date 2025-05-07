import { Express } from 'express';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { db } from '@db';

jest.mock('@db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    eq: jest.fn(),
    delete: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@db/schema', () => ({
  players: { id: 'id' },
  matches: { id: 'id' },
  achievements: { id: 'id' },
  playerAchievements: { id: 'id' },
}));

describe.skip('API Routes', () => {
  let app: Express;
  let server: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    server = registerRoutes(app);
  });

  afterEach(() => {
    server.close();
    jest.clearAllMocks();
  });

  test('GET /api/players should return all players with stats', async () => {
    const mockPlayers = [
      { id: 1, name: 'Player 1', startYear: 2020, createdAt: '2020-01-01T00:00:00Z' },
      { id: 2, name: 'Player 2', startYear: 2021, createdAt: '2021-01-01T00:00:00Z' },
    ];
    
    const mockMatches = [
      { 
        id: 1, 
        date: '2025-04-01T00:00:00Z',
        teamOnePlayerOneId: 1,
        teamOneGamesWon: 3,
        teamTwoGamesWon: 1
      },
    ];
    
    const mockExecute = jest.fn();
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        execute: mockExecute
      })
    });
    
    mockExecute.mockResolvedValueOnce(mockPlayers).mockResolvedValueOnce(mockMatches);
    
    const response = await request(app).get('/api/players');
    
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  test('POST /api/players should create a new player', async () => {
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 3, name: 'New Player' }])
      })
    });
    
    const response = await request(app)
      .post('/api/players')
      .send({ name: 'New Player', startYear: 2023 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 3);
    expect(response.body).toHaveProperty('name', 'New Player');
  });

  test('DELETE /api/players/:id should delete a player', async () => {
    const response = await request(app).delete('/api/players/1');
    
    expect(response.status).toBe(204);
    expect(db.delete).toHaveBeenCalled();
  });
});
