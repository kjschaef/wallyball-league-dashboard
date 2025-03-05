import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';
import * as dbConfig from '../../db/config';

describe('API Routes Tests', () => {
  let app: Express;
  let sandbox: sinon.SinonSandbox;
  let mockDb: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    app = express();
    
    // Mock database to avoid actual DB connections during tests
    mockDb = {
      select: sandbox.stub(),
      insert: sandbox.stub(),
      update: sandbox.stub(),
      delete: sandbox.stub(),
    };
    
    // Stub the database to return our mock
    sandbox.stub(dbConfig, 'getDatabase').returns(mockDb);
    
    // Register routes with our mocked dependencies
    registerRoutes(app);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /api/players', () => {
    it('should return a list of players', async () => {
      // Mock data
      const mockPlayers = [
        { id: 1, name: 'Player 1', startYear: 2020, createdAt: new Date() },
        { id: 2, name: 'Player 2', startYear: 2021, createdAt: new Date() }
      ];
      
      // Setup the mock database response
      mockDb.select.callsFake(() => ({
        from: () => ({
          orderBy: () => Promise.resolve(mockPlayers)
        })
      }));
      
      // Test the endpoint
      const response = await request(app).get('/api/players');
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(mockPlayers);
    });
  });
});