import { expect } from 'chai';
import sinon from 'sinon';
import { db } from '../../db';
import { players } from '../../db/schema';
import { eq } from 'drizzle-orm';

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
      const mockPlayer = {
        id: 1,
        name: 'Test Player',
        startYear: 2023,
        createdAt: new Date()
      };
      
      // Mock the database query response
      const queryStub = sandbox.stub().resolves([mockPlayer]);
      sandbox.stub(db, 'select').returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().returns({
            get: queryStub
          })
        })
      } as any);
      
      // Execute the operation (simulating how it would be used in the app)
      const result = await db.select().from(players).where(eq(players.id, 1));
      
      // Assert that the result is as expected
      expect(result).to.deep.equal([mockPlayer]);
    });
    
    it('should return empty array when player not found', async () => {
      // Mock the database query response for not found
      const queryStub = sandbox.stub().resolves([]);
      sandbox.stub(db, 'select').returns({
        from: sandbox.stub().returns({
          where: sandbox.stub().returns({
            get: queryStub
          })
        })
      } as any);
      
      // Execute the operation
      const result = await db.select().from(players).where(eq(players.id, 999));
      
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
      
      const insertedPlayer = {
        id: 5,
        name: 'New Player',
        startYear: 2024,
        createdAt: new Date()
      };
      
      // Mock the database insert operation
      const insertStub = sandbox.stub().resolves([insertedPlayer]);
      sandbox.stub(db, 'insert').returns({
        values: sandbox.stub().returns({
          returning: sandbox.stub().returns({
            get: insertStub
          })
        })
      } as any);
      
      // Execute the operation (simulating how it would be used in the app)
      const result = await db.insert(players).values(newPlayer).returning().get();
      
      // Assert the result
      expect(result).to.deep.equal([insertedPlayer]);
    });
  });
});