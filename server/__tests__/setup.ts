// This file contains global test setup for server-side tests
import { jest, afterAll, beforeEach } from '@jest/globals';
import { db } from '../../db';

// Default timeout of 10 seconds for all tests
jest.setTimeout(10000);

// Automatically mock the database to prevent actual DB connections in tests
jest.mock('../../db', () => {
  // Create a mock implementation that's safer to work with in tests
  const mockDb = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue([])
          }),
          execute: jest.fn().mockResolvedValue([])
        }),
        orderBy: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        }),
        execute: jest.fn().mockResolvedValue([])
      })
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        })
      })
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue([])
          })
        })
      })
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        }),
        execute: jest.fn().mockResolvedValue({
          rowCount: 1
        })
      })
    }),
    transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockDb);
    })
  };

  return {
    db: mockDb
  };
});

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
  ],
  
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
  ],
  
  achievements: [
    { id: 1, name: 'First Victory', description: 'Win your first match', icon: '🏆' },
    { id: 2, name: 'Perfect Score', description: 'Win a match 3-0', icon: '🌟' },
    { id: 3, name: 'Comeback King', description: 'Win after being down 0-2', icon: '👑' }
  ],
  
  playerAchievements: [
    { id: 1, playerId: 1, achievementId: 1, unlockedAt: new Date('2023-05-01') },
    { id: 2, playerId: 1, achievementId: 2, unlockedAt: new Date('2023-05-15') },
    { id: 3, playerId: 2, achievementId: 1, unlockedAt: new Date('2023-05-01') }
  ]
};

// Helper to configure mock DB for specific test cases
export const configureMockDb = (options: { 
  selectResults?: any[],
  insertResults?: any[],
  updateResults?: any[],
  deleteResults?: { rowCount: number } 
}) => {
  const { selectResults, insertResults, updateResults, deleteResults } = options;
  
  if (selectResults) {
    (db.select as any).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(selectResults)
          }),
          execute: jest.fn().mockResolvedValue(selectResults)
        }),
        orderBy: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue(selectResults)
        }),
        execute: jest.fn().mockResolvedValue(selectResults)
      })
    });
  }
  
  if (insertResults) {
    (db.insert as any).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue(insertResults)
        })
      })
    });
  }
  
  if (updateResults) {
    (db.update as any).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(updateResults)
          })
        })
      })
    });
  }
  
  if (deleteResults) {
    (db.delete as any).mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        }),
        execute: jest.fn().mockResolvedValue(deleteResults)
      })
    });
  }
};