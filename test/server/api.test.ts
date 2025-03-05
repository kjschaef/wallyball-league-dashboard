import { expect } from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import express, { Express } from 'express';
import { db } from '../../db';
import { players, matches, type Player } from '../../db/schema';

// Import routes registration
import { registerRoutes } from '../../server/routes';

describe('API Routes', () => {
  let app: Express;
  let request: any; // Use 'any' temporarily to avoid TypeScript errors with supertest
  let sandbox: sinon.SinonSandbox;
  
  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    
    // Setup body parsing middleware
    app.use(express.json());
    
    // Set up the sandbox for stubbing
    sandbox = sinon.createSandbox();
    
    // Register the routes
    registerRoutes(app);
    
    // Create supertest instance
    request = supertest(app);
  });
  
  afterEach(() => {
    // Restore stubs
    sandbox.restore();
  });
  
  describe('GET /api/players', () => {
    it('should return all players', async () => {
      // Prepare test data
      const mockPlayers: Player[] = [
        { id: 1, name: 'Player 1', startYear: 2022, createdAt: new Date() },
        { id: 2, name: 'Player 2', startYear: 2023, createdAt: new Date() }
      ];
      
      // Create a proper mock of the select chain
      const orderByStub = sandbox.stub().resolves(mockPlayers);
      const fromMock = { orderBy: orderByStub };
      const selectMock = { from: sandbox.stub().returns(fromMock) };
      
      // Stub the DB call
      sandbox.stub(db, 'select').returns(selectMock as any);
      
      // Make the request
      const response = await request.get('/api/players');
      
      // Assert response
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(2);
      expect(response.body[0]).to.have.property('name', 'Player 1');
    });
    
    it('should handle database errors', async () => {
      // Create a proper mock of the select chain
      const orderByStub = sandbox.stub().rejects(new Error('Database error'));
      const fromMock = { orderBy: orderByStub };
      const selectMock = { from: sandbox.stub().returns(fromMock) };
      
      // Stub the DB call to simulate an error
      sandbox.stub(db, 'select').returns(selectMock as any);
      
      // Make the request
      const response = await request.get('/api/players');
      
      // Assert response
      expect(response.status).to.equal(500);
      expect(response.body).to.have.property('error');
    });
  });
  
  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      // Prepare test data
      const newPlayer = {
        name: 'New Player',
        startYear: 2024
      };
      
      const createdPlayer: Player = {
        id: 3,
        name: 'New Player',
        startYear: 2024,
        createdAt: new Date()
      };
      
      // Create a proper mock of the insert chain
      const executeStub = sandbox.stub().resolves([createdPlayer]);
      const returningMock = { execute: executeStub };
      const valuesMock = { returning: sandbox.stub().returns(returningMock) };
      const insertMock = { values: sandbox.stub().returns(valuesMock) };
      
      // Stub the DB call
      sandbox.stub(db, 'insert').returns(insertMock as any);
      
      // Make the request
      const response = await request
        .post('/api/players')
        .send(newPlayer)
        .set('Content-Type', 'application/json');
      
      // Assert response
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id', 3);
      expect(response.body).to.have.property('name', 'New Player');
    });
    
    it('should validate required fields', async () => {
      // Make the request with missing required field
      const response = await request
        .post('/api/players')
        .send({ startYear: 2024 }) // Missing name
        .set('Content-Type', 'application/json');
      
      // Assert response
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });
});