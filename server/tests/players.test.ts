/**
 * Unit tests for the player API endpoints using Mocha and Chai
 */
import { expect, request, createTestApp, resetStubs } from './testUtils.js';
import { db } from './setup.js';
import { players, matches } from '../../db/schema.js';
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

  // Sample matches data for testing
  const mockMatches = [];

  beforeEach(() => {
    // Create a test app with routes registered
    const testApp = createTestApp();
    app = testApp.app;
    server = testApp.server;

    // Reset all stubs
    resetStubs();
    
    // Setup default chain of stubs for GET /api/players
    db.select.returns(db);
    db.from.onFirstCall().resolves(mockPlayers);
    db.from.onSecondCall().resolves(mockMatches);
  });

  afterEach(() => {
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
      
      // Verify that the database was called with the correct parameters
      sinon.assert.calledWith(db.from, players);
    });
  });

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const newPlayer = {
        name: 'New Player',
        startYear: 2023
      };
      
      // Setup stub for player creation
      db.insert.returns(db);
      db.values.returns(db);
      db.returning.resolves([{ id: 3, ...newPlayer, createdAt: new Date() }]);
      
      const res = await request(app)
        .post('/api/players')
        .send(newPlayer);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('id', 3);
      expect(res.body).to.have.property('name', 'New Player');
      
      // Verify database calls
      sinon.assert.calledWith(db.insert, players);
      sinon.assert.calledWith(db.values, newPlayer);
    });
  });

  // Add more test cases for PUT, DELETE endpoints
});