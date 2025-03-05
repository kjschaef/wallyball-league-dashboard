import { expect } from 'chai';
import supertest from 'supertest';
import express, { Express } from 'express';
import sinon from 'sinon';
import { MockDatabase } from '../db/mockDb';
import { Player } from '../../db/schema';

describe('API Routes', () => {
  let app: Express;
  let request: any; // Use any to avoid TypeScript errors with supertest
  let mockDb: MockDatabase;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    // Create a new app and mock database for each test
    app = express();
    mockDb = new MockDatabase();
    sandbox = sinon.createSandbox();
    
    // Set up basic middleware
    app.use(express.json());
    
    // Set up routes for testing
    app.get('/api/players', async (req, res) => {
      try {
        const players = await mockDb.getAllPlayers();
        res.json(players);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve players' });
      }
    });
    
    app.get('/api/players/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const player = await mockDb.getPlayerById(id);
        
        if (!player) {
          return res.status(404).json({ error: 'Player not found' });
        }
        
        res.json(player);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve player' });
      }
    });
    
    app.post('/api/players', async (req, res) => {
      try {
        const newPlayer = await mockDb.createPlayer(req.body);
        res.status(201).json(newPlayer);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create player' });
      }
    });
    
    // Initialize supertest
    request = supertest(app);
  });
  
  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /api/players', () => {
    it('should return all players', async () => {
      // Arrange
      const mockPlayers = [
        { id: 1, name: 'Player 1', startYear: 2021, createdAt: new Date() },
        { id: 2, name: 'Player 2', startYear: 2022, createdAt: new Date() }
      ];
      
      sandbox.stub(mockDb, 'getAllPlayers').resolves(mockPlayers);
      
      // Act
      const response = await request.get('/api/players');
      
      // Assert
      expect(response.status).to.equal(200);
      expect(response.body).to.have.lengthOf(2);
      expect(response.body[0].name).to.equal('Player 1');
      expect(response.body[1].name).to.equal('Player 2');
    });
  });
  
  describe('GET /api/players/:id', () => {
    it('should return a player when found', async () => {
      // Arrange
      const mockPlayer: Player = { 
        id: 1, 
        name: 'Player 1', 
        startYear: 2021, 
        createdAt: new Date() 
      };
      
      sandbox.stub(mockDb, 'getPlayerById').withArgs(1).resolves(mockPlayer);
      
      // Act
      const response = await request.get('/api/players/1');
      
      // Assert
      expect(response.status).to.equal(200);
      expect(response.body.id).to.equal(1);
      expect(response.body.name).to.equal('Player 1');
    });
    
    it('should return 404 when player not found', async () => {
      // Arrange
      sandbox.stub(mockDb, 'getPlayerById').withArgs(999).resolves(undefined);
      
      // Act
      const response = await request.get('/api/players/999');
      
      // Assert
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });
  
  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      // Arrange
      const newPlayerData = { name: 'New Player', startYear: 2023 };
      const createdPlayer: Player = { 
        id: 3, 
        name: 'New Player', 
        startYear: 2023, 
        createdAt: new Date() 
      };
      
      sandbox.stub(mockDb, 'createPlayer').resolves(createdPlayer);
      
      // Act
      const response = await request
        .post('/api/players')
        .send(newPlayerData)
        .set('Content-Type', 'application/json');
      
      // Assert
      expect(response.status).to.equal(201);
      expect(response.body.id).to.equal(3);
      expect(response.body.name).to.equal('New Player');
    });
  });
});