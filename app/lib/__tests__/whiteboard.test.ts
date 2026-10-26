import {
  levenshtein,
  matchRosterName,
  normalizeWhiteboardMatches,
  computeGamesWon,
  validateLogPayload,
  type WhiteboardMatchRaw,
} from '../whiteboard';

describe('app/lib/whiteboard', () => {
  const roster = ['Nate', 'Ben', 'Keith', 'Hal', 'Mark', 'Vamsi', 'Seth', 'Zach', 'Paul', 'Parker'];

  describe('levenshtein', () => {
    it('computes edit distance accurately', () => {
      expect(levenshtein('Keith', 'Keith')).toBe(0);
      expect(levenshtein('Kieth', 'Keith')).toBe(2);
      expect(levenshtein('', 'Nate')).toBe(4);
      expect(levenshtein('Nate', '')).toBe(4);
    });
  });

  describe('matchRosterName', () => {
    it('matches exact roster names case-insensitively', () => {
      expect(matchRosterName('nate', roster)).toEqual({
        raw: 'nate',
        matched: 'Nate',
        confidence: 'exact',
        candidates: [],
      });
    });

    it('matches fuzzy single candidate within edit distance 2', () => {
      expect(matchRosterName('Vamsy', roster)).toEqual({
        raw: 'Vamsy',
        matched: 'Vamsi',
        confidence: 'fuzzy',
        candidates: [],
      });
    });

    it('flags ambiguous matches when multiple roster names are close', () => {
      const res = matchRosterName('Par', roster);
      expect(res.confidence).toBe('ambiguous');
      expect(res.matched).toBeNull();
      expect(res.candidates).toEqual(expect.arrayContaining(['Paul', 'Parker']));
    });

    it('flags unknown names that do not match roster', () => {
      expect(matchRosterName('Xander', roster)).toEqual({
        raw: 'Xander',
        matched: null,
        confidence: 'unknown',
        candidates: [],
      });
    });
  });

  describe('normalizeWhiteboardMatches', () => {
    it('normalizes played and unplayed matches and flags issues for review', () => {
      const raw: WhiteboardMatchRaw[] = [
        {
          matchNumber: 1,
          teamOne: { players: ['Nate', 'Ben', 'Keith'] },
          teamTwo: { players: ['Hal', 'Mark', 'Vamsi'] },
          games: [
            { teamOneScore: 5, teamTwoScore: 11 },
            { teamOneScore: 11, teamTwoScore: 6 },
          ],
          played: true,
        },
        {
          matchNumber: 2,
          teamOne: { players: ['Nate', 'Keith', 'Seth'] },
          teamTwo: { players: ['Hal', 'Vamsi', 'Zach'] },
          games: [],
          played: false,
        },
      ];

      const result = normalizeWhiteboardMatches(raw, roster);
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].needsReview).toBe(false);
      expect(result.matches[0].reviewReasons).toEqual([]);
      expect(result.matches[1].played).toBe(false);
      expect(result.matches[1].needsReview).toBe(true);
      expect(result.matches[1].reviewReasons).toContain(
        'No scores on the board yet — this matchup has not been played'
      );
    });
  });

  describe('computeGamesWon', () => {
    it('counts games won per team', () => {
      expect(
        computeGamesWon([
          { teamOneScore: 5, teamTwoScore: 11 },
          { teamOneScore: 11, teamTwoScore: 6 },
          { teamOneScore: 11, teamTwoScore: 7 },
        ])
      ).toEqual({ teamOne: 2, teamTwo: 1 });
    });
  });

  describe('validateLogPayload', () => {
    it('accepts valid payload and rejects ties or missing scores', () => {
      expect(
        validateLogPayload({
          date: '2026-10-23',
          matches: [
            {
              teamOnePlayers: ['Nate', 'Ben', 'Keith'],
              teamTwoPlayers: ['Hal', 'Mark', 'Vamsi'],
              games: [{ teamOneScore: 11, teamTwoScore: 7 }],
            },
          ],
        })
      ).toEqual([]);

      const tieErrors = validateLogPayload({
        date: '2026-10-23',
        matches: [
          {
            teamOnePlayers: ['Nate'],
            teamTwoPlayers: ['Hal'],
            games: [{ teamOneScore: 11, teamTwoScore: 11 }],
          },
        ],
      });
      expect(tieErrors).toContain('Match 1 game 1: a game cannot end in a tie');
    });
  });
});
