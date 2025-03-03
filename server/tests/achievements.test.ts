/**
 * Unit tests for the achievements API endpoints
 */
import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createTestApp, resetMocks } from './testUtils.js';
import { db } from '../../db/index.js';
import { matches, achievements, playerAchievements } from '../../db/schema.js';

// Mock data for tests
const mockMatches = [
  {
    id: 1,
    teamOnePlayerOneId: 1,
    teamOnePlayerTwoId: null,
    teamOnePlayerThreeId: null,
    teamTwoPlayerOneId: 2,
    teamTwoPlayerTwoId: null,
    teamTwoPlayerThreeId: null,
    teamOneGamesWon: 3,
    teamTwoGamesWon: 0, // Perfect game for player 1
    date: new Date('2023-01-15')
  },
  {
    id: 2,
    teamOnePlayerOneId: 1,
    teamOnePlayerTwoId: 3,
    teamOnePlayerThreeId: null,
    teamTwoPlayerOneId: 2,
    teamTwoPlayerTwoId: 4,
    teamTwoPlayerThreeId: null,
    teamOneGamesWon: 2,
    teamTwoGamesWon: 3,
    date: new Date('2023-01-22')
  }
];

const mockAchievements = [
  {
    id: 1,
    name: 'First Game',
    description: 'Play your first game',
    icon: 'trophy',
    condition: 'games_played >= 1'
  },
  {
    id: 2,
    name: 'Perfect Game',
    description: 'Win a match without losing any games',
    icon: 'star',
    condition: 'perfect_games >= 1'
  },
  {
    id: 3,
    name: 'Veteran',
    description: 'Play at least 10 games',
    icon: 'medal',
    condition: 'games_played >= 10'
  }
];

const mockPlayerAchievements = [
  {
    id: 1,
    playerId: 1,
    achievementId: 1,
    unlockedAt: new Date('2023-01-15')
  }
];

describe('Achievements API Endpoints', () => {
  const { app } = createTestApp();
  
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/achievements/:playerId', () => {
    it('should return player achievements with details', async () => {
      // Mock database responses
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: 'First Game',
          description: 'Play your first game',
          icon: 'trophy',
          unlockedAt: new Date('2023-01-15')
        }
      ]);

      const response = await request(app).get('/api/achievements/1');
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('icon');
      expect(response.body[0]).toHaveProperty('unlockedAt');
      
      // Verify db was called correctly
      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });

    it('should return 500 when query fails', async () => {
      // Mock database error
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/api/achievements/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/achievements/check/:playerId', () => {
    it('should check and award achievements', async () => {
      const playerId = 1;
      
      // Mock database responses for each query
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockImplementation((table) => {
        if (table === matches) {
          return {
            where: jest.fn().mockResolvedValue(mockMatches)
          };
        } else if (table === achievements) {
          return {
            then: (callback: Function) => Promise.resolve(callback(mockAchievements))
          };
        } else if (table === playerAchievements) {
          return {
            where: jest.fn().mockResolvedValue(mockPlayerAchievements)
          };
        }
        return db;
      });
      
      // Mock insert for new achievements
      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).post(`/api/achievements/check/${playerId}`);
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('newAchievements');
      expect(response.body).toHaveProperty('stats');
      
      // Should have unlocked the Perfect Game achievement
      expect(response.body.newAchievements).toHaveLength(1);
      expect(response.body.newAchievements[0].name).toBe('Perfect Game');
      
      // Stats should be calculated correctly
      expect(response.body.stats.gamesPlayed).toBe(2);
      expect(response.body.stats.perfectGames).toBe(1);
      
      // Verify db calls
      expect(db.select).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalledWith(playerAchievements);
    });

    it('should return empty achievements when no new achievements', async () => {
      const playerId = 1;
      
      // Mock all achievements already unlocked
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockImplementation((table) => {
        if (table === matches) {
          return {
            where: jest.fn().mockResolvedValue(mockMatches)
          };
        } else if (table === achievements) {
          return {
            then: (callback: Function) => Promise.resolve(callback(mockAchievements))
          };
        } else if (table === playerAchievements) {
          // Player already has all achievements
          return {
            where: jest.fn().mockResolvedValue([
              { id: 1, playerId: 1, achievementId: 1, unlockedAt: new Date() },
              { id: 2, playerId: 1, achievementId: 2, unlockedAt: new Date() },
              { id: 3, playerId: 1, achievementId: 3, unlockedAt: new Date() }
            ])
          };
        }
        return db;
      });

      const response = await request(app).post(`/api/achievements/check/${playerId}`);
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body.newAchievements).toHaveLength(0);
    });

    it('should return 500 when achievements check fails', async () => {
      // Mock database error
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).post('/api/achievements/check/1');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});