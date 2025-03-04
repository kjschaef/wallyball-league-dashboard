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
    it('should have the correct structure', () => {
      expect(players.name).toBe('players');
      
      // Check columns
      expect(players.$columns.id.name).toBe('id');
      expect(players.$columns.name.name).toBe('name');
      expect(players.$columns.startYear.name).toBe('start_year');
      expect(players.$columns.createdAt.name).toBe('created_at');
      
      // Check primary key
      expect(players.$columns.id.primary).toBe(true);
    });
  });

  describe('matches table', () => {
    it('should have the correct structure', () => {
      expect(matches.name).toBe('matches');
      
      // Check columns
      expect(matches.$columns.id.name).toBe('id');
      expect(matches.$columns.teamOnePlayerOneId.name).toBe('team_one_player_one_id');
      expect(matches.$columns.teamOnePlayerTwoId.name).toBe('team_one_player_two_id');
      expect(matches.$columns.teamTwoPlayerOneId.name).toBe('team_two_player_one_id');
      expect(matches.$columns.teamTwoPlayerTwoId.name).toBe('team_two_player_two_id');
      expect(matches.$columns.teamOneGamesWon.name).toBe('team_one_games_won');
      expect(matches.$columns.teamTwoGamesWon.name).toBe('team_two_games_won');
      expect(matches.$columns.date.name).toBe('date');
      
      // Check primary key
      expect(matches.$columns.id.primary).toBe(true);
    });
  });

  describe('achievements table', () => {
    it('should have the correct structure', () => {
      expect(achievements.name).toBe('achievements');
      
      // Check columns
      expect(achievements.$columns.id.name).toBe('id');
      expect(achievements.$columns.name.name).toBe('name');
      expect(achievements.$columns.description.name).toBe('description');
      expect(achievements.$columns.icon.name).toBe('icon');
      
      // Check primary key
      expect(achievements.$columns.id.primary).toBe(true);
    });
  });

  describe('playerAchievements table', () => {
    it('should have the correct structure', () => {
      expect(playerAchievements.name).toBe('player_achievements');
      
      // Check columns
      expect(playerAchievements.$columns.playerId.name).toBe('player_id');
      expect(playerAchievements.$columns.achievementId.name).toBe('achievement_id');
      expect(playerAchievements.$columns.unlockedAt.name).toBe('unlocked_at');
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