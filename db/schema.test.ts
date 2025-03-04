import { 
  players, 
  matches, 
  achievements, 
  playerAchievements, 
  Player,
  Match,
  Achievement,
  PlayerAchievement 
} from './schema';

describe('Database Schema', () => {
  describe('players table', () => {
    it('should have the correct table name', () => {
      expect(players.name).toBe('players');
    });
    
    it('should have all required columns', () => {
      // Check that the columns exist
      expect(players.id).toBeDefined();
      expect(players.name).toBeDefined();
      expect(players.startYear).toBeDefined();
      expect(players.createdAt).toBeDefined();
    });
  });

  describe('matches table', () => {
    it('should have the correct table name', () => {
      expect(matches.name).toBe('matches');
    });
    
    it('should have all required columns', () => {
      // Check that the columns exist
      expect(matches.id).toBeDefined();
      expect(matches.teamOnePlayerOneId).toBeDefined();
      expect(matches.teamOnePlayerTwoId).toBeDefined();
      expect(matches.teamTwoPlayerOneId).toBeDefined();
      expect(matches.teamTwoPlayerTwoId).toBeDefined();
      expect(matches.teamOneGamesWon).toBeDefined();
      expect(matches.teamTwoGamesWon).toBeDefined();
      expect(matches.date).toBeDefined();
    });
  });

  describe('achievements table', () => {
    it('should have the correct table name', () => {
      expect(achievements.name).toBe('achievements');
    });
    
    it('should have all required columns', () => {
      // Check that the columns exist
      expect(achievements.id).toBeDefined();
      expect(achievements.name).toBeDefined();
      expect(achievements.description).toBeDefined();
      expect(achievements.icon).toBeDefined();
    });
  });

  describe('playerAchievements table', () => {
    it('should have the correct table name', () => {
      expect(playerAchievements.name).toBe('player_achievements');
    });
    
    it('should have all required columns', () => {
      // Check that the columns exist
      expect(playerAchievements.playerId).toBeDefined();
      expect(playerAchievements.achievementId).toBeDefined();
      expect(playerAchievements.unlockedAt).toBeDefined();
    });
  });

  // Type tests (these don't actually run but help with type checking)
  describe('type definitions', () => {
    it('should have correct type definitions', () => {
      // These are just type checks, not actual runtime tests
      const player = {} as Player;
      const match = {} as Match;
      const achievement = {} as Achievement;
      const playerAchievement = {} as PlayerAchievement;

      // Just make sure the compiler is happy with these types
      expect(typeof player).toBe('object');
      expect(typeof match).toBe('object');
      expect(typeof achievement).toBe('object');
      expect(typeof playerAchievement).toBe('object');
    });
  });
});