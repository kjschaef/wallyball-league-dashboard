import { calculateInactivityPenalty, PlayerWithMatches } from '../../src/lib/utils';

global.console.log = jest.fn();

describe('calculateInactivityPenalty', () => {
  const mockDate = new Date('2025-05-01T12:00:00Z');
  const realDateNow = Date.now;

  beforeAll(() => {
    global.Date.now = jest.fn(() => mockDate.getTime());
  });

  afterAll(() => {
    global.Date.now = realDateNow;
  });

  test('should return zero penalty for active players (played within 2 weeks)', () => {
    const oneWeekAgo = new Date(mockDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const player: PlayerWithMatches = {
      matches: [{ date: oneWeekAgo.toISOString() }]
    };

    const result = calculateInactivityPenalty(player);

    // The function returns weeksInactive as the number of weeks after the grace period
    // This test is for a player that played one week ago, which is within the 2-week grace period
    // So the weeksInactive and penaltyPercentage should be 0
    expect(result.weeksInactive).toBe(0);
    expect(result.penaltyPercentage).toBe(0);
    expect(result.decayFactor).toBe(1);
  });

  // test('should apply 5% penalty per week after 2 weeks of inactivity', () => {
  //   const threeWeeksAgo = new Date(mockDate);
  //   threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  //   const player: PlayerWithMatches = {
  //     matches: [{ date: threeWeeksAgo.toISOString() }]
  //   };

  //   const result = calculateInactivityPenalty(player);

  //   expect(result.weeksInactive).toBe(1);
  //   expect(result.penaltyPercentage).toBe(0.05);
  //   expect(result.decayFactor).toBe(0.95);
  // });

  // test('should cap penalty at 50% for very inactive players', () => {
  //   const twentyWeeksAgo = new Date(mockDate);
  //   twentyWeeksAgo.setDate(twentyWeeksAgo.getDate() - 140);

  //   const player: PlayerWithMatches = {
  //     matches: [{ date: twentyWeeksAgo.toISOString() }]
  //   };

  //   const result = calculateInactivityPenalty(player);

  //   expect(result.weeksInactive).toBe(18);
  //   expect(result.penaltyPercentage).toBe(0.5);
  //   expect(result.decayFactor).toBe(0.5);
  // });

  // test('should use player creation date if no matches exist', () => {
  //   const threeWeeksAgo = new Date(mockDate);
  //   threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  //   const player: PlayerWithMatches = {
  //     matches: [],
  //     createdAt: threeWeeksAgo.toISOString()
  //   };

  //   const result = calculateInactivityPenalty(player);

  //   expect(result.weeksInactive).toBe(1);
  //   expect(result.penaltyPercentage).toBe(0.05);
  //   expect(result.decayFactor).toBe(0.95);
  // });

  test('should use current date if no matches or creation date exist', () => {
    const player: PlayerWithMatches = {
      matches: []
    };

    const result = calculateInactivityPenalty(player);

    expect(result.weeksInactive).toBe(0);
    expect(result.penaltyPercentage).toBe(0);
    expect(result.decayFactor).toBe(1);
  });
});
