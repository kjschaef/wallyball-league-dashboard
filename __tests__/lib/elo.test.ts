import {
  getKFactor,
  calculateMarginMultiplier,
  calculateTeamAverageElo,
  calculateExpectedWinRate,
  computeChronologicalElo,
  INITIAL_ELO,
  PROVISIONAL_THRESHOLD
} from '@/app/lib/elo';

describe('Elo Module (app/lib/elo)', () => {
  describe('getKFactor', () => {
    it('returns 48 for provisional players (< 10 games)', () => {
      expect(getKFactor(0)).toBe(48);
      expect(getKFactor(9)).toBe(48);
    });

    it('returns 32 for established players (10 to 30 games)', () => {
      expect(getKFactor(10)).toBe(32);
      expect(getKFactor(20)).toBe(32);
      expect(getKFactor(30)).toBe(32);
    });

    it('returns 24 for veteran players (> 30 games)', () => {
      expect(getKFactor(31)).toBe(24);
      expect(getKFactor(100)).toBe(24);
    });
  });

  describe('calculateMarginMultiplier', () => {
    it('returns 1.0 when scores are missing or invalid', () => {
      expect(calculateMarginMultiplier(undefined, undefined)).toBe(1.0);
      expect(calculateMarginMultiplier(null, null)).toBe(1.0);
      expect(calculateMarginMultiplier(NaN, 11)).toBe(1.0);
    });

    it('scales logarithmically with point margin', () => {
      const closeMultiplier = calculateMarginMultiplier(11, 9); // margin 2
      const mediumMultiplier = calculateMarginMultiplier(11, 6); // margin 5
      const blowoutMultiplier = calculateMarginMultiplier(11, 1); // margin 10

      expect(closeMultiplier).toBeLessThan(mediumMultiplier);
      expect(mediumMultiplier).toBeLessThan(blowoutMultiplier);
      expect(closeMultiplier).toBeGreaterThan(0.5);
      expect(blowoutMultiplier).toBeLessThan(2.0);
    });
  });

  describe('calculateTeamAverageElo', () => {
    it('calculates the average Elo for team members', () => {
      const ratingsMap = new Map([
        [1, { id: 1, elo: 1600, careerGames: 20, isProvisional: false }],
        [2, { id: 2, elo: 1400, careerGames: 20, isProvisional: false }],
        [3, { id: 3, elo: 1500, careerGames: 10, isProvisional: false }],
      ]);

      expect(calculateTeamAverageElo([1, 2], ratingsMap)).toBe(1500);
      expect(calculateTeamAverageElo([1, 2, 3], ratingsMap)).toBe(1500);
      expect(calculateTeamAverageElo([1], ratingsMap)).toBe(1600);
    });

    it('defaults to INITIAL_ELO if player is not in map or team is empty', () => {
      const ratingsMap = new Map<number, any>();
      expect(calculateTeamAverageElo([99], ratingsMap)).toBe(INITIAL_ELO);
      expect(calculateTeamAverageElo([], ratingsMap)).toBe(INITIAL_ELO);
    });
  });

  describe('calculateExpectedWinRate', () => {
    it('returns 0.5 for equal ratings', () => {
      expect(calculateExpectedWinRate(1500, 1500)).toBe(0.5);
    });

    it('returns higher probability for higher rated team', () => {
      const prob = calculateExpectedWinRate(1600, 1400);
      expect(prob).toBeGreaterThan(0.7);
      expect(prob).toBeLessThan(0.8);
    });
  });

  describe('computeChronologicalElo', () => {
    it('initializes all players to INITIAL_ELO and provisional true', () => {
      const players = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      const ratings = computeChronologicalElo(players, []);

      expect(ratings.get(1)?.elo).toBe(1500);
      expect(ratings.get(1)?.careerGames).toBe(0);
      expect(ratings.get(1)?.isProvisional).toBe(true);
      expect(ratings.get(2)?.elo).toBe(1500);
    });

    it('correctly updates ratings for 1v1 matches', () => {
      const players = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      const matches = [
        {
          id: 1,
          team_one_player_one_id: 1,
          team_two_player_one_id: 2,
          team_one_games_won: 2,
          team_two_games_won: 0,
          date: '2025-01-01',
        },
      ];

      const ratings = computeChronologicalElo(players, matches);
      const alice = ratings.get(1)!;
      const bob = ratings.get(2)!;

      // Alice won both games (2-0 sweep), expected win was 0.5
      // K=48 (provisional), delta per game = 48 * (1 - 0.5) * 1.0 = 24
      // Total gain ≈ +48
      expect(alice.elo).toBeGreaterThan(1540);
      expect(bob.elo).toBeLessThan(1460);
      expect(alice.careerGames).toBe(2);
      expect(bob.careerGames).toBe(2);
    });

    it('handles multi-player teams (2v2 and 2v3)', () => {
      const players = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Diana' },
        { id: 5, name: 'Eve' },
      ];

      const matches = [
        // 2v3 match: Alice & Bob vs Charlie, Diana, Eve
        {
          id: 1,
          team_one_player_one_id: 1,
          team_one_player_two_id: 2,
          team_two_player_one_id: 3,
          team_two_player_two_id: 4,
          team_two_player_three_id: 5,
          team_one_games_won: 1,
          team_two_games_won: 0,
          date: '2025-01-01',
        },
      ];

      const ratings = computeChronologicalElo(players, matches);
      const alice = ratings.get(1)!;
      const bob = ratings.get(2)!;
      const charlie = ratings.get(3)!;

      expect(alice.elo).toBeGreaterThan(1500);
      expect(bob.elo).toBeGreaterThan(1500);
      expect(charlie.elo).toBeLessThan(1500);
    });

    it('transitions player from provisional to established at 10 games', () => {
      const players = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      // 5 matches of 2 games each = 10 games total
      const matches = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        team_one_player_one_id: 1,
        team_two_player_one_id: 2,
        team_one_games_won: 1,
        team_two_games_won: 1,
        date: `2025-01-0${i + 1}`,
      }));

      const ratings = computeChronologicalElo(players, matches);
      expect(ratings.get(1)?.careerGames).toBe(10);
      expect(ratings.get(1)?.isProvisional).toBe(false);
    });
  });
});
