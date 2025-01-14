
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { getDatabase } from '@db/config';
import { players, matches } from '@db/schema';

const testDb = getDatabase(process.env.TEST_DATABASE_URL);

describe('API Routes', () => {
  let app: express.Express;
  let server: any;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    server = registerRoutes(app);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    // Clear test database before each test
    await testDb.delete(matches);
    await testDb.delete(players);
  });

  describe('Players Endpoints', () => {
    it('GET /api/players should return empty array initially', async () => {
      const response = await request(app).get('/api/players');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('POST /api/players should create a new player', async () => {
      const playerData = { name: 'Test Player' };
      const response = await request(app)
        .post('/api/players')
        .send(playerData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(playerData.name);
    });

    it('PUT /api/players/:id should update player name', async () => {
      // Create player first
      const createRes = await request(app)
        .post('/api/players')
        .send({ name: 'Original Name' });
      
      const updateRes = await request(app)
        .put(`/api/players/${createRes.body.id}`)
        .send({ name: 'Updated Name' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Updated Name');
    });

    it('DELETE /api/players/:id should delete player and their matches', async () => {
      // Create player
      const createRes = await request(app)
        .post('/api/players')
        .send({ name: 'To Delete' });

      const deleteRes = await request(app)
        .delete(`/api/players/${createRes.body.id}`);
      
      expect(deleteRes.status).toBe(204);

      // Verify player is gone
      const getRes = await request(app)
        .get('/api/players');
      expect(getRes.body).toEqual([]);
    });
  });

  describe('Matches Endpoints', () => {
    let player1: any, player2: any;

    beforeEach(async () => {
      // Create test players
      const res1 = await request(app)
        .post('/api/players')
        .send({ name: 'Player 1' });
      player1 = res1.body;

      const res2 = await request(app)
        .post('/api/players')
        .send({ name: 'Player 2' });
      player2 = res2.body;
    });

    it('POST /api/games should create a new match', async () => {
      const matchData = {
        teamOnePlayerOneId: player1.id,
        teamTwoPlayerOneId: player2.id,
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1,
      };

      const response = await request(app)
        .post('/api/games')
        .send(matchData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.teamOneGamesWon).toBe(2);
      expect(response.body.teamTwoGamesWon).toBe(1);
    });

    it('GET /api/matches should return matches with player names', async () => {
      // Create a match first
      await request(app)
        .post('/api/games')
        .send({
          teamOnePlayerOneId: player1.id,
          teamTwoPlayerOneId: player2.id,
          teamOneGamesWon: 2,
          teamTwoGamesWon: 1,
        });

      const response = await request(app).get('/api/matches');
      expect(response.status).toBe(200);
      expect(response.body[0].teamOnePlayers).toContain('Player 1');
      expect(response.body[0].teamTwoPlayers).toContain('Player 2');
    });
  });
});
