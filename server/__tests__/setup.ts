// This file contains global test setup for server-side tests
import { jest, afterAll, beforeEach } from '@jest/globals';

// Define base types for mocking
// Use a more compatible definition for MockFn
type MockFn = jest.Mock;
type UnknownFunction = (...args: any[]) => any;

// Define our data types
export interface Player {
  id: number;
  name: string;
  startYear?: number | null;
  createdAt: Date;
}

export interface Match {
  id: number;
  date: Date | null;
  teamOnePlayerOneId: number | null;
  teamOnePlayerTwoId: number | null;
  teamOnePlayerThreeId: number | null;
  teamTwoPlayerOneId: number | null;
  teamTwoPlayerTwoId: number | null;
  teamTwoPlayerThreeId: number | null;
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface PlayerAchievement {
  id: number;
  playerId: number;
  achievementId: number;
  unlockedAt: Date;
}

// Define return types for mock functions to improve type safety
type EmptyArray = any[];
type RowCount = { rowCount: number };
type MockReturnValue = EmptyArray | RowCount | Promise<any>;

// Extend Jest's Mock type to allow any return value
declare global {
  namespace jest {
    interface Mock {
      mockResolvedValue(value: any): this;
      mockReturnValue(value: any): this;
      mockImplementation(fn: (...args: any[]) => any): this;
    }
  }
}

// Define types for our mock database chains
interface MockExecute {
  execute: MockFn;
}

interface MockOrderBy extends MockExecute {
  orderBy: MockFn;
}

interface MockWhere extends MockOrderBy {
  where: MockFn;
}

interface MockFrom {
  from: MockFn;
  where?: MockFn;
  execute?: MockFn;
}

interface MockValues {
  values: MockFn;
}

interface MockSet {
  set: MockFn;
}

interface MockReturning {
  returning: MockFn;
}

// Define the core mock database structure
interface MockDb {
  select: MockFn;
  insert: MockFn;
  update: MockFn;
  delete: MockFn;
  transaction: MockFn;
}

// Default timeout of 10 seconds for all tests
jest.setTimeout(10000);

// Create a strongly-typed mock DB
const createMockDb = (): MockDb => {
  // Create execute function that returns empty array
  const createExecuteFn = (): MockFn => {
    const fn = jest.fn();
    fn.mockResolvedValue([]);
    return fn;
  };
  
  // Create orderBy function
  const createOrderByFn = (): MockFn => 
    jest.fn().mockReturnValue({
      execute: createExecuteFn()
    });
  
  // Create where function
  const createWhereFn = (): MockFn => 
    jest.fn().mockReturnValue({
      orderBy: createOrderByFn(),
      execute: createExecuteFn()
    });
  
  // Create from function
  const createFromFn = (): MockFn => 
    jest.fn().mockReturnValue({
      where: createWhereFn(),
      orderBy: createOrderByFn(),
      execute: createExecuteFn()
    });

  // Create returning function
  const createReturningFn = (): MockFn =>
    jest.fn().mockReturnValue({
      execute: createExecuteFn()
    });
  
  // Create values function
  const createValuesFn = (): MockFn =>
    jest.fn().mockReturnValue({
      returning: createReturningFn()
    });
  
  // Create set function 
  const createSetFn = (): MockFn =>
    jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: createReturningFn()
      })
    });

  // Create select function
  const selectFn: MockFn = 
    jest.fn().mockReturnValue({
      from: createFromFn()
    });

  // Create insert function
  const insertFn: MockFn =
    jest.fn().mockReturnValue({
      values: createValuesFn()
    });
  
  // Create update function
  const updateFn: MockFn =
    jest.fn().mockReturnValue({
      set: createSetFn()
    });
  
  // Create delete function
  const deleteFn: MockFn = jest.fn();
  deleteFn.mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: createReturningFn(),
      execute: (() => {
        const fn = jest.fn();
        fn.mockResolvedValue({ rowCount: 1 });
        return fn;
      })()
    })
  });

  // Create transaction function with proper typing
  const transactionFn: MockFn = jest.fn();
  transactionFn.mockImplementation(async (callback: (db: MockDb) => Promise<any>) => {
    return callback(mockDb);
  });

  // Assemble the mock database
  const mockDb: MockDb = {
    select: selectFn,
    insert: insertFn,
    update: updateFn,
    delete: deleteFn,
    transaction: transactionFn
  };

  return mockDb;
};

// Create the mock database
const mockDb = createMockDb();

// Mock the database module
jest.mock('../../db', () => ({
  db: mockDb
}));

// Also mock @db alias
jest.mock('@db', () => ({
  db: mockDb
}), { virtual: true });

// Also mock @db/schema
jest.mock('@db/schema', () => ({
  players: {},
  matches: {},
  achievements: {},
  playerAchievements: {}
}), { virtual: true });

// Export the mock db for use in tests
export const db = mockDb;

// Log test suite lifecycle
console.log('Starting server test suite');

afterAll(() => {
  console.log('Server test suite completed');
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Helper function to provide mock data for tests
export const getMockData = {
  players: [
    { id: 1, name: 'Alice', startYear: 2021, createdAt: new Date('2023-01-01') },
    { id: 2, name: 'Bob', startYear: 2022, createdAt: new Date('2023-01-02') },
    { id: 3, name: 'Charlie', startYear: 2020, createdAt: new Date('2023-01-03') }
  ] as Player[],
  
  matches: [
    {
      id: 1,
      date: new Date('2023-05-01'),
      teamOnePlayerOneId: 1,
      teamOnePlayerTwoId: 2,
      teamOnePlayerThreeId: null,
      teamTwoPlayerOneId: 3,
      teamTwoPlayerTwoId: 4,
      teamTwoPlayerThreeId: null,
      teamOneGamesWon: 3,
      teamTwoGamesWon: 1
    },
    {
      id: 2,
      date: new Date('2023-05-15'),
      teamOnePlayerOneId: 1,
      teamOnePlayerTwoId: 2,
      teamOnePlayerThreeId: null,
      teamTwoPlayerOneId: 5,
      teamTwoPlayerTwoId: 6,
      teamTwoPlayerThreeId: null,
      teamOneGamesWon: 2,
      teamTwoGamesWon: 3
    }
  ] as Match[],
  
  achievements: [
    { id: 1, name: 'First Victory', description: 'Win your first match', icon: '🏆' },
    { id: 2, name: 'Perfect Score', description: 'Win a match 3-0', icon: '🌟' },
    { id: 3, name: 'Comeback King', description: 'Win after being down 0-2', icon: '👑' }
  ] as Achievement[],
  
  playerAchievements: [
    { id: 1, playerId: 1, achievementId: 1, unlockedAt: new Date('2023-05-01') },
    { id: 2, playerId: 1, achievementId: 2, unlockedAt: new Date('2023-05-15') },
    { id: 3, playerId: 2, achievementId: 1, unlockedAt: new Date('2023-05-01') }
  ] as PlayerAchievement[]
};

// Helper to configure mock DB for specific test cases
export const configureMockDb = <T>(options: { 
  selectResults?: T[],
  insertResults?: T[],
  updateResults?: T[],
  deleteResults?: { rowCount: number } 
}): void => {
  const { selectResults, insertResults, updateResults, deleteResults } = options;
  
  if (selectResults) {
    // Configure select chain
    const executeFn = jest.fn().mockResolvedValue(selectResults as any[]);
    const orderByFn = jest.fn().mockReturnValue({ execute: executeFn });
    const whereFn = jest.fn().mockReturnValue({ 
      orderBy: orderByFn,
      execute: executeFn 
    });
    const fromFn = jest.fn().mockReturnValue({
      where: whereFn,
      orderBy: orderByFn,
      execute: executeFn
    });
    
    mockDb.select.mockReturnValue({ from: fromFn });
  }
  
  if (insertResults) {
    // Configure insert chain
    const executeFn = jest.fn().mockResolvedValue(insertResults as any[]);
    const returningFn = jest.fn().mockReturnValue({ execute: executeFn });
    const valuesFn = jest.fn().mockReturnValue({ returning: returningFn });
    
    mockDb.insert.mockReturnValue({ values: valuesFn });
  }
  
  if (updateResults) {
    // Configure update chain
    const executeFn = jest.fn().mockResolvedValue(updateResults as any[]);
    const returningFn = jest.fn().mockReturnValue({ execute: executeFn });
    const whereFn = jest.fn().mockReturnValue({ returning: returningFn });
    const setFn = jest.fn().mockReturnValue({ where: whereFn });
    
    mockDb.update.mockReturnValue({ set: setFn });
  }
  
  if (deleteResults) {
    // Configure delete chain
    const returningExecuteFn = jest.fn().mockResolvedValue([] as any[]);
    const returningFn = jest.fn().mockReturnValue({ execute: returningExecuteFn });
    const executeWhereFn = jest.fn().mockResolvedValue(deleteResults as RowCount);
    const whereFn = jest.fn().mockReturnValue({
      returning: returningFn,
      execute: executeWhereFn
    });
    
    mockDb.delete.mockReturnValue({ where: whereFn });
  }
};