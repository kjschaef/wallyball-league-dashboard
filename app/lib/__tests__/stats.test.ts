import { calculatePlayerStats } from '../stats';

describe('calculatePlayerStats', () => {
    beforeAll(() => {
        jest.useFakeTimers({ advanceTimers: true });
        jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z').getTime());
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const mockPlayers = [
        { id: 1, name: 'Alice', created_at: '2020-01-01T00:00:00.000Z', start_year: 2020 },
        { id: 2, name: 'Bob', created_at: '2023-01-01T00:00:00.000Z', start_year: null }, // Falls back to created_at
        { id: 3, name: 'Charlie', created_at: '2024-01-01T00:00:00.000Z', start_year: 2024 }
    ];

    const mockMatches = [
        {
            id: 1,
            date: '2024-01-01T12:00:00.000Z',
            team_one_player_one_id: 1,
            team_one_player_two_id: 2,
            team_one_player_three_id: null,
            team_two_player_one_id: 3,
            team_two_player_two_id: null,
            team_two_player_three_id: null,
            team_one_games_won: 2,
            team_two_games_won: 1
        },
        {
            id: 2,
            date: '2023-12-01T12:00:00.000Z', // Different date to test totalPlayingTime
            team_one_player_one_id: 3,
            team_one_player_two_id: null,
            team_one_player_three_id: null,
            team_two_player_one_id: 1,
            team_two_player_two_id: null,
            team_two_player_three_id: null,
            team_one_games_won: 0,
            team_two_games_won: 3
        }
    ];

    it('returns an empty array when given no players', async () => {
        const stats = await calculatePlayerStats([], [], null, null, null);
        expect(stats).toEqual([]);
    });

    it('correctly calculates basic stats for a player with no matches', async () => {
        const stats = await calculatePlayerStats([mockPlayers[0]], [], null, null, null);

        expect(stats).toHaveLength(1);
        expect(stats[0]).toEqual(expect.objectContaining({
            id: 1,
            name: 'Alice',
            yearsPlayed: 4, // 2024 - 2020
            record: { wins: 0, losses: 0, totalGames: 0 },
            winPercentage: 0,
            totalPlayingTime: 0,
            actualWinPercentage: 0,
            lastGameDate: null
        }));
    });

    it('calculates wins, losses, and winPercentage accurately', async () => {
        const stats = await calculatePlayerStats(mockPlayers, mockMatches, null, null, null);

        // Alice:
        // Match 1: Team 1 (Won 2-1) -> 2 wins, 1 loss
        // Match 2: Team 2 (Won 3-0) -> 3 wins, 0 losses
        // Total: 5 wins, 1 loss -> Win % = 5/6 * 100 = 83.33...
        const alice = stats.find(p => p.id === 1)!;
        expect(alice.record).toEqual({ wins: 5, losses: 1, totalGames: 6 });
        expect(alice.winPercentage).toBeCloseTo((5 / 6) * 100);

        // Bob:
        // Match 1: Team 1 (Won 2-1) -> 2 wins, 1 loss
        // Total: 2 wins, 1 loss -> Win % = 2/3 * 100 = 66.66...
        const bob = stats.find(p => p.id === 2)!;
        expect(bob.record).toEqual({ wins: 2, losses: 1, totalGames: 3 });
        expect(bob.winPercentage).toBeCloseTo((2 / 3) * 100);

        // Charlie:
        // Match 1: Team 2 (Lost 1-2) -> 1 win, 2 losses
        // Match 2: Team 1 (Lost 0-3) -> 0 wins, 3 losses
        // Total: 1 win, 5 losses -> Win % = 1/6 * 100 = 16.66...
        const charlie = stats.find(p => p.id === 3)!;
        expect(charlie.record).toEqual({ wins: 1, losses: 5, totalGames: 6 });
        expect(charlie.winPercentage).toBeCloseTo((1 / 6) * 100);
    });

    it('sorts players by win percentage descending', async () => {
        const stats = await calculatePlayerStats(mockPlayers, mockMatches, null, null, null);

        expect(stats[0].name).toBe('Alice'); // ~83.3%
        expect(stats[1].name).toBe('Bob'); // ~66.7%
        expect(stats[2].name).toBe('Charlie'); // ~16.7%
    });

    it('calculates total playing time based on unique days played', async () => {
        const stats = await calculatePlayerStats(mockPlayers, mockMatches, null, null, null);

        // Alice played on 2 unique days: 2024-01-01 and 2023-12-01
        // Expected: (2 * 90) / 60 = 3 hours
        const alice = stats.find(p => p.id === 1)!;
        expect(alice.totalPlayingTime).toBe(3);

        // Bob played on 1 unique day: 2024-01-01
        // Expected: (1 * 90) / 60 = 1.5 rounded to 2 hours
        const bob = stats.find(p => p.id === 2)!;
        expect(bob.totalPlayingTime).toBe(2);
    });

    it('handles players missing dates properly (calculates 1 year played minimum)', async () => {
        const playersNoDates = [
            { id: 4, name: 'Dave', created_at: null, start_year: null }
        ];

        const stats = await calculatePlayerStats(playersNoDates, [], null, null, null);

        // Should default to current year minus current year = 0, but Math.max(1, 0) makes it 1.
        expect(stats[0].yearsPlayed).toBe(1);
    });

    it('handles errors during processing and returns fallback stats', async () => {
        // Suppress console.error for this expected error test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // We simulate an error by providing an invalid match array that causes a failure when mapping over dates.
        const errorPlayer = [{ id: 1, name: 'ErrorPlayer', start_year: 2024 }];

        // date being null will cause new Date(match.date).toISOString() to return a valid epoch date depending on environment,
        // so we need something that causes an actual throw inside the try block
        // The easiest way is passing undefined to new Date(undefined).toISOString() which throws "Invalid time value"
        const invalidMatches = [{
            team_one_player_one_id: 1,
            date: 'invalid-date-string' // "invalid-date-string" -> Date gets Invalid Date -> toISOString() throws RangeError
        }];

        const stats = await calculatePlayerStats(errorPlayer, invalidMatches, null, null, null);

        // It should gracefully catch the RangeError and return default stats
        // with undefined/default values
        expect(stats[0].yearsPlayed).toBe(1);
        expect(stats[0].winPercentage).toBe(0);
        expect(stats[0].record).toEqual({ wins: 0, losses: 0, totalGames: 0 });

        consoleSpy.mockRestore();
    });
});
