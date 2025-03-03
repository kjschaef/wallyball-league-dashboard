/**
 * Unit tests for the player API endpoints using Mocha and Chai
 */
import { expect, request, stubMethod, createTestApp, resetStubs } from './testUtils.js';
import { db } from '../../db/index.js';
import { players } from '../../db/schema.js';
import sinon from 'sinon';

describe('Player API Endpoints', () => {
  let app;
  let server;

  // Sample player data for testing
  const mockPlayers = [
    {
      id: 1,
      name: 'Player One',
      startYear: 2020,
      createdAt: new Date('2023-01-01')
    },
    {
      id: 2,
      name: 'Player Two',
      startYear: 2021,
      createdAt: new Date('2023-01-02')
    }
  ];

  beforeEach(() => {
    // Create a test app with routes registered
    const testApp = createTestApp();
    app = testApp.app;
    server = testApp.server;

    // Stub the database query to return mock data
    stubMethod(db.query, 'select').resolves(mockPlayers);
  });

  afterEach(() => {
    // Reset all stubs between tests
    resetStubs();
    server.close();
  });

  describe('GET /api/players', () => {
    it('should return a list of players', async () => {
      const res = await request(app).get('/api/players');
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(2);
      expect(res.body[0]).to.have.property('name', 'Player One');
      expect(res.body[1]).to.have.property('name', 'Player Two');
    });
  });

  describe('GET /api/players/:id', () => {
    it('should return a single player by ID', async () => {
      // Stub for single player query
      const singlePlayerStub = stubMethod(db.query, 'selectOne').resolves(mockPlayers[0]);
      
      const res = await request(app).get('/api/players/1');
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('id', 1);
      expect(res.body).to.have.property('name', 'Player One');
    });

    it('should return 404 for non-existent player', async () => {
      // Stub for non-existent player query
      const notFoundStub = stubMethod(db.query, 'selectOne').resolves(null);
      
      const res = await request(app).get('/api/players/999');
      
      expect(res).to.have.status(404);
    });
  });

  // Add more test cases for POST, PUT, DELETE endpoints
});