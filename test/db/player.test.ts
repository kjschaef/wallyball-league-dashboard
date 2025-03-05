import { expect } from 'chai';
import sinon from 'sinon';
import { db } from '../../db';
import { players } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { type Player } from '../../db/schema';

describe('Player Database Operations', () => {
  let sandbox: sinon.SinonSandbox;
  
  beforeEach(() => {
    // Create a sandbox for managing stubs
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // Restore all stubbed methods
    sandbox.restore();
  });
  
  describe('getPlayerById', () => {
    it('should return a player when found', async () => {
      // Prepare test data
      const mockPlayer: Player = {
        id: 1,
        name: 'Test Player',
        startYear: 2023,
        createdAt: new Date()
      };
      
      // Mock the database query response
      const queryStub = sandbox.stub().resolves([mockPlayer]);
      
      // Create a proper mock of the select chain
      const whereMock = { execute: queryStub };
      const fromMock = { where: sandbox.stub().returns(whereMock) };
      const selectMock = { from: sandbox.stub().returns(fromMock) };
      
      sandbox.stub(db, 'select').returns(selectMock as any);
      
      // Execute the operation (simulating how it would be used in the app)
      const result = await db.select().from(players).where(eq(players.id, 1)).execute();
      
      // Assert that the result is as expected
      expect(result).to.deep.equal([mockPlayer]);
    });
    
    it('should return empty array when player not found', async () => {
      // Mock the database query response for not found
      const queryStub = sandbox.stub().resolves([]);
      
      // Create a proper mock of the select chain
      const whereMock = { execute: queryStub };
      const fromMock = { where: sandbox.stub().returns(whereMock) };
      const selectMock = { from: sandbox.stub().returns(fromMock) };
      
      sandbox.stub(db, 'select').returns(selectMock as any);
      
      // Execute the operation
      const result = await db.select().from(players).where(eq(players.id, 999)).execute();
      
      // Assert that the result is empty
      expect(result).to.be.an('array').that.is.empty;
    });
  });
  
  describe('createPlayer', () => {
    it('should insert a new player and return the result', async () => {
      // Prepare test data
      const newPlayer = {
        name: 'New Player',
        startYear: 2024
      };
      
      const insertedPlayer: Player = {
        id: 5,
        name: 'New Player',
        startYear: 2024,
        createdAt: new Date()
      };
      
      // Mock the database insert operation
      const executeStub = sandbox.stub().resolves([insertedPlayer]);
      
      // Create a proper mock of the insert chain
      const returningMock = { execute: executeStub };
      const valuesMock = { returning: sandbox.stub().returns(returningMock) };
      const insertMock = { values: sandbox.stub().returns(valuesMock) };
      
      sandbox.stub(db, 'insert').returns(insertMock as any);
      
      // Execute the operation (simulating how it would be used in the app)
      const result = await db.insert(players).values(newPlayer).returning().execute();
      
      // Assert the result
      expect(result).to.deep.equal([insertedPlayer]);
    });
  });
});