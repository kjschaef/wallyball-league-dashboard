import { Player, Match, Achievement, PlayerAchievement } from '../../db/schema';

// Create factory functions to generate mock data for tests

export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: Math.floor(Math.random() * 1000),
  name: `Player-${Math.random().toString(36).substring(2, 7)}`,
  startYear: new Date().getFullYear(),
  createdAt: new Date(),
  ...overrides
});

export const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
  id: Math.floor(Math.random() * 1000),
  teamOnePlayerOneId: 1,
  teamOnePlayerTwoId: 2,
  teamTwoPlayerOneId: 3,
  teamTwoPlayerTwoId: 4,
  teamOneGamesWon: 2,
  teamTwoGamesWon: 1,
  date: new Date(),
  ...overrides
});

export const createMockAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
  id: Math.floor(Math.random() * 1000),
  name: `Achievement-${Math.random().toString(36).substring(2, 7)}`,
  description: 'A test achievement',
  icon: 'trophy',
  ...overrides
});

export const createMockPlayerAchievement = (overrides: Partial<PlayerAchievement> = {}): PlayerAchievement => ({
  playerId: 1,
  achievementId: 1,
  unlockedAt: new Date(),
  ...overrides
});

// Create factory functions for arrays of mock data
export const createMockPlayers = (count: number, baseOverrides: Partial<Player> = {}): Player[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockPlayer({ 
      id: index + 1,
      ...baseOverrides 
    })
  );
};

export const createMockMatches = (count: number, baseOverrides: Partial<Match> = {}): Match[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockMatch({ 
      id: index + 1,
      ...baseOverrides 
    })
  );
};

export const createMockAchievements = (count: number, baseOverrides: Partial<Achievement> = {}): Achievement[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockAchievement({ 
      id: index + 1,
      ...baseOverrides 
    })
  );
};

export const createMockPlayerAchievements = (count: number, baseOverrides: Partial<PlayerAchievement> = {}): PlayerAchievement[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockPlayerAchievement({ 
      playerId: index + 1,
      ...baseOverrides 
    })
  );
};