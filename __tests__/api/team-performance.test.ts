import { NextRequest } from 'next/server';
import { GET } from '@/app/api/team-performance/route';

// Mock the neon database connection
const mockSql = jest.fn();

const createMockSql = () => {
    return Object.assign(
        jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
            const query = strings.join('');
            // Store interpolated values so tests can inspect season filtering
            if (query.includes('FROM matches') && query.includes('WHERE date')) {
                return mockSql('matches-filtered', values);
            } else if (query.includes('FROM matches')) {
                return mockSql('matches');
            } else if (query.includes('FROM players')) {
                return mockSql('players');
            }
            return mockSql('unknown');
        }),
        { transaction: jest.fn() }
    );
};

jest.mock('@neondatabase/serverless', () => ({
    neon: jest.fn(() => createMockSql()),
}));

process.env.DATABASE_URL = 'mock-database-url';

// ---- Shared fixtures ----

const PLAYERS = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'Diana' },
    { id: 5, name: 'Eve' },
    { id: 6, name: 'Frank' },
];

/** Helper to build a match row quickly */
function match(
    id: number,
    t1: number[], t2: number[],
    t1Won: number, t2Won: number,
    date = '2025-03-01',
) {
    return {
        id,
        team_one_player_one_id: t1[0] ?? null,
        team_one_player_two_id: t1[1] ?? null,
        team_one_player_three_id: t1[2] ?? null,
        team_two_player_one_id: t2[0] ?? null,
        team_two_player_two_id: t2[1] ?? null,
        team_two_player_three_id: t2[2] ?? null,
        team_one_games_won: t1Won,
        team_two_games_won: t2Won,
        date,
    };
}

function setupMocks(matches: any[], players = PLAYERS) {
    mockSql.mockImplementation((queryType: string) => {
        if (queryType === 'matches' || queryType === 'matches-filtered') {
            return Promise.resolve(matches);
        }
        if (queryType === 'players') {
            return Promise.resolve(players);
        }
        return Promise.resolve([]);
    });
}

// ---- Tests ----

describe('/api/team-performance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // Basic response structure
    // =========================================================================
    describe('response structure', () => {
        it('should return an array', async () => {
            setupMocks([]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });

        it('should return correct fields for each team', async () => {
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            expect(data.length).toBeGreaterThan(0);
            const team = data[0];
            expect(team).toHaveProperty('id');
            expect(team).toHaveProperty('players');
            expect(team).toHaveProperty('wins');
            expect(team).toHaveProperty('losses');
            expect(team).toHaveProperty('winPercentage');
            expect(team).toHaveProperty('totalGames');
            expect(team).toHaveProperty('gameWins');
            expect(team).toHaveProperty('gameLosses');
            expect(team).toHaveProperty('totalIndividualGames');
            expect(team).toHaveProperty('gameWinPercentage');
        });
    });

    // =========================================================================
    // Win / loss tracking
    // =========================================================================
    describe('match win/loss tracking', () => {
        it('should award match win to team with more games won', async () => {
            // Team [1,2] wins 3-1 over [3,4]
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const winner = data.find((t: any) => t.players.includes('Alice'));
            const loser = data.find((t: any) => t.players.includes('Charlie'));

            expect(winner.wins).toBe(1);
            expect(winner.losses).toBe(0);
            expect(loser.wins).toBe(0);
            expect(loser.losses).toBe(1);
        });

        it('should handle tie matches correctly (no win/loss awarded)', async () => {
            // 2-2 tie
            setupMocks([match(1, [1, 2], [3, 4], 2, 2)]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            for (const team of data) {
                expect(team.wins).toBe(0);
                expect(team.losses).toBe(0);
            }
        });

        it('should accumulate wins and losses across multiple matches', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1), // [1,2] wins
                match(2, [1, 2], [3, 4], 1, 3), // [3,4] wins
                match(3, [1, 2], [3, 4], 2, 1), // [1,2] wins
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamAB = data.find((t: any) => t.players.includes('Alice'));
            const teamCD = data.find((t: any) => t.players.includes('Charlie'));

            expect(teamAB.wins).toBe(2);
            expect(teamAB.losses).toBe(1);
            expect(teamCD.wins).toBe(1);
            expect(teamCD.losses).toBe(2);
        });
    });

    // =========================================================================
    // Individual game counting
    // =========================================================================
    describe('individual game tracking', () => {
        it('should count individual game wins and losses correctly', async () => {
            // 3-1 match
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const winner = data.find((t: any) => t.players.includes('Alice'));
            const loser = data.find((t: any) => t.players.includes('Charlie'));

            expect(winner.gameWins).toBe(3);
            expect(winner.gameLosses).toBe(1);
            expect(winner.totalIndividualGames).toBe(4); // 3+1
            expect(loser.gameWins).toBe(1);
            expect(loser.gameLosses).toBe(3);
            expect(loser.totalIndividualGames).toBe(4);
        });

        it('should accumulate game counts across matches', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1), // 4 games
                match(2, [1, 2], [3, 4], 2, 3), // 5 games
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamAB = data.find((t: any) => t.players.includes('Alice'));
            expect(teamAB.gameWins).toBe(5);  // 3+2
            expect(teamAB.gameLosses).toBe(4); // 1+3
            expect(teamAB.totalIndividualGames).toBe(9); // 4+5
        });

        it('should handle null game scores as zero', async () => {
            setupMocks([{
                id: 1,
                team_one_player_one_id: 1,
                team_one_player_two_id: 2,
                team_one_player_three_id: null,
                team_two_player_one_id: 3,
                team_two_player_two_id: 4,
                team_two_player_three_id: null,
                team_one_games_won: null,
                team_two_games_won: null,
                date: '2025-01-01',
            }]);

            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            for (const team of data) {
                expect(team.gameWins).toBe(0);
                expect(team.gameLosses).toBe(0);
                expect(team.totalIndividualGames).toBe(0);
            }
        });
    });

    // =========================================================================
    // Win percentage calculations
    // =========================================================================
    describe('win percentage calculations', () => {
        it('should calculate match win percentage correctly', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1),
                match(2, [1, 2], [3, 4], 2, 1),
                match(3, [1, 2], [3, 4], 1, 3),
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamAB = data.find((t: any) => t.players.includes('Alice'));
            // 2 wins out of 3 matches = 66.7%
            expect(teamAB.winPercentage).toBe(66.7);
        });

        it('should calculate game win percentage correctly', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1), // 3 game wins of 4 games
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamAB = data.find((t: any) => t.players.includes('Alice'));
            // 3 game wins out of 4 total = 75%
            expect(teamAB.gameWinPercentage).toBe(75);
        });

        it('should return 0% for teams with zero games', async () => {
            setupMocks([{
                id: 1,
                team_one_player_one_id: 1,
                team_one_player_two_id: 2,
                team_one_player_three_id: null,
                team_two_player_one_id: 3,
                team_two_player_two_id: 4,
                team_two_player_three_id: null,
                team_one_games_won: null,
                team_two_games_won: null,
                date: '2025-01-01',
            }]);

            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            for (const team of data) {
                expect(team.gameWinPercentage).toBe(0);
            }
        });
    });

    // =========================================================================
    // Team identity / combination handling
    // =========================================================================
    describe('team identity', () => {
        // -----------------------------------------------------------------------
        // Teammate order does not matter
        // -----------------------------------------------------------------------
        describe('teammate order does not matter', () => {
            it('2-player: [A,B] and [B,A] are the same team', async () => {
                setupMocks([
                    match(1, [1, 2], [3, 4], 3, 1), // Alice,Bob
                    match(2, [2, 1], [3, 4], 2, 1), // Bob,Alice — reversed
                ]);
                const res = await GET(new NextRequest('http://localhost/api/team-performance'));
                const data = await res.json();

                expect(data).toHaveLength(2); // not 3
                const team = data.find((t: any) => t.players.includes('Alice') && t.players.includes('Bob'));
                expect(team.totalGames).toBe(2);
                expect(team.wins).toBe(2);
            });

            it('3-player: all 6 permutations of [A,B,C] collapse into one team', async () => {
                const permutations = [
                    [1, 2, 3],
                    [1, 3, 2],
                    [2, 1, 3],
                    [2, 3, 1],
                    [3, 1, 2],
                    [3, 2, 1],
                ];
                setupMocks(
                    permutations.map((order, i) => match(i + 1, order, [4, 5, 6], 3, 1))
                );
                const res = await GET(new NextRequest('http://localhost/api/team-performance'));
                const data = await res.json();

                expect(data).toHaveLength(2); // [A,B,C] and [D,E,F], not 7
                const teamABC = data.find((t: any) =>
                    t.players.includes('Alice') && t.players.includes('Bob') && t.players.includes('Charlie')
                );
                expect(teamABC.totalGames).toBe(6); // one match per permutation
                expect(teamABC.wins).toBe(6);
            });

            it('accumulated stats are correct across mixed orderings', async () => {
                setupMocks([
                    match(1, [1, 2], [3, 4], 3, 1), // Alice,Bob win  → +3 gameWins, +1 gameLoss
                    match(2, [2, 1], [3, 4], 1, 3), // Bob,Alice lose → +1 gameWin,  +3 gameLosses
                ]);
                const res = await GET(new NextRequest('http://localhost/api/team-performance'));
                const data = await res.json();

                const team = data.find((t: any) => t.players.includes('Alice') && t.players.includes('Bob'));
                expect(team.totalGames).toBe(2);
                expect(team.wins).toBe(1);
                expect(team.losses).toBe(1);
                expect(team.gameWins).toBe(4);   // 3 + 1
                expect(team.gameLosses).toBe(4); // 1 + 3
                expect(team.totalIndividualGames).toBe(8);
            });

            it('ordering does not affect which players are on opposing teams', async () => {
                // Both orderings of [3,4] should still be the same opponent
                setupMocks([
                    match(1, [1, 2], [3, 4], 3, 1),
                    match(2, [1, 2], [4, 3], 2, 1),
                ]);
                const res = await GET(new NextRequest('http://localhost/api/team-performance'));
                const data = await res.json();

                expect(data).toHaveLength(2);
                const teamCD = data.find((t: any) => t.players.includes('Charlie') && t.players.includes('Diana'));
                expect(teamCD.totalGames).toBe(2);
                expect(teamCD.losses).toBe(2);
            });
        });

        it('should distinguish between different team combinations', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1),
                match(2, [1, 3], [2, 4], 2, 1), // Different team combo
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            // Should have 4 distinct teams: [1,2], [3,4], [1,3], [2,4]
            expect(data).toHaveLength(4);
        });

        it('should handle 3-player teams correctly', async () => {
            setupMocks([
                match(1, [1, 2, 3], [4, 5, 6], 3, 2),
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            expect(data).toHaveLength(2);
            const team123 = data.find((t: any) => t.players.length === 3 && t.players.includes('Alice'));
            expect(team123.players).toHaveLength(3);
            expect(team123.gameWins).toBe(3);
            expect(team123.gameLosses).toBe(2);
        });

        it('should sort player names alphabetically within a team', async () => {
            setupMocks([
                match(1, [3, 1], [4, 2], 3, 1), // Charlie=3, Alice=1
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamAC = data.find((t: any) => t.players.includes('Alice') && t.players.includes('Charlie'));
            expect(teamAC.players).toEqual(['Alice', 'Charlie']);
        });

        it('should handle unknown player IDs gracefully', async () => {
            setupMocks(
                [match(1, [1, 999], [3, 4], 3, 1)],
                PLAYERS, // player 999 not in the list
            );
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamWithUnknown = data.find((t: any) => t.players.includes('Unknown'));
            expect(teamWithUnknown).toBeDefined();
            expect(teamWithUnknown.players).toContain('Alice');
            expect(teamWithUnknown.players).toContain('Unknown');
        });
    });

    // =========================================================================
    // Sorting
    // =========================================================================
    describe('sorting', () => {
        it('should sort teams by match win percentage descending', async () => {
            setupMocks([
                // Team [1,2] wins 1 of 2
                match(1, [1, 2], [3, 4], 3, 1),
                match(2, [1, 2], [3, 4], 1, 3),
                // Team [5,6] wins 2 of 2
                match(3, [5, 6], [3, 4], 3, 1),
                match(4, [5, 6], [3, 4], 2, 1),
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            // Team [5,6] (100%) should come before [1,2] (50%)
            const ef = data.findIndex((t: any) => t.players.includes('Eve'));
            const ab = data.findIndex((t: any) => t.players.includes('Alice') && t.players.includes('Bob'));
            expect(ef).toBeLessThan(ab);
        });
    });

    // =========================================================================
    // Season filtering
    // =========================================================================
    describe('season filtering', () => {
        it('should filter by season when ?season=<id> is provided', async () => {
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            // 20251 = 2025 Q1
            const res = await GET(new NextRequest('http://localhost/api/team-performance?season=20251'));
            const data = await res.json();

            expect(res.status).toBe(200);
            // The mock will have been called with 'matches-filtered'
            expect(mockSql).toHaveBeenCalledWith('matches-filtered', expect.any(Array));
        });

        it('should return all matches when no season param is provided', async () => {
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            await GET(new NextRequest('http://localhost/api/team-performance'));

            expect(mockSql).toHaveBeenCalledWith('matches');
        });

        it('should return 404 for invalid season ID', async () => {
            setupMocks([]);
            // ID that produces null from getSeasonById (quarter > 4, e.g. 20259)
            const res = await GET(new NextRequest('http://localhost/api/team-performance?season=20259'));

            expect(res.status).toBe(404);
            const data = await res.json();
            expect(data.error).toBe('Season not found');
        });

        it('should fetch all matches for lifetime season (id=0)', async () => {
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance?season=0'));
            const data = await res.json();

            expect(res.status).toBe(200);
            // Lifetime has empty start/end dates, so it falls to the "fetch all" branch
            expect(mockSql).toHaveBeenCalledWith('matches');
        });

        it('should ignore non-numeric season param', async () => {
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance?season=abc'));
            const data = await res.json();

            // Non-numeric falls through to "no season" logic
            expect(res.status).toBe(200);
            expect(mockSql).toHaveBeenCalledWith('matches');
        });
    });

    // =========================================================================
    // Edge cases
    // =========================================================================
    describe('edge cases', () => {
        it('should return empty array for no matches', async () => {
            setupMocks([]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            expect(data).toEqual([]);
        });

        it('should handle single match correctly', async () => {
            setupMocks([match(1, [1, 2], [3, 4], 3, 1)]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            expect(data).toHaveLength(2);
        });

        it('should handle a team playing many matches', async () => {
            const matches = [];
            for (let i = 0; i < 20; i++) {
                // Team [1,2] alternately beats and loses to [3,4]
                matches.push(match(i + 1, [1, 2], [3, 4], i % 2 === 0 ? 3 : 1, i % 2 === 0 ? 1 : 3));
            }
            setupMocks(matches);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamAB = data.find((t: any) => t.players.includes('Alice'));
            expect(teamAB.totalGames).toBe(20); // 20 matches
            expect(teamAB.wins).toBe(10);
            expect(teamAB.losses).toBe(10);
            expect(teamAB.winPercentage).toBe(50);
        });

        it('should handle matches with asymmetric team sizes (2v3)', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4, 5], 3, 2),
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const team2 = data.find((t: any) => t.players.length === 2);
            const team3 = data.find((t: any) => t.players.length === 3);

            expect(team2).toBeDefined();
            expect(team3).toBeDefined();
            expect(team2.gameWins).toBe(3);
            expect(team3.gameWins).toBe(2);
        });
    });

    // =========================================================================
    // Math integrity — cross-check game sums
    // =========================================================================
    describe('math integrity', () => {
        it('total games for both teams in a match should be equal', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 2),
                match(2, [1, 2], [3, 4], 1, 3),
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            const teamAB = data.find((t: any) => t.players.includes('Alice'));
            const teamCD = data.find((t: any) => t.players.includes('Charlie'));

            // Both teams played the same matches → same totalIndividualGames
            expect(teamAB.totalIndividualGames).toBe(teamCD.totalIndividualGames);
        });

        it('gameWins + gameLosses should equal totalIndividualGames', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1),
                match(2, [1, 2], [3, 4], 2, 3),
                match(3, [5, 6], [1, 2], 1, 2),
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            for (const team of data) {
                expect(team.gameWins + team.gameLosses).toBe(team.totalIndividualGames);
            }
        });

        it('wins + losses should equal totalGames (excluding ties)', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1),
                match(2, [1, 2], [3, 4], 1, 3),
                match(3, [1, 2], [3, 4], 2, 1),
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            for (const team of data) {
                expect(team.wins + team.losses).toBe(team.totalGames);
            }
        });

        it('wins + losses may be less than totalGames when ties exist', async () => {
            setupMocks([
                match(1, [1, 2], [3, 4], 3, 1), // decisive
                match(2, [1, 2], [3, 4], 2, 2), // tie
            ]);
            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            const data = await res.json();

            for (const team of data) {
                expect(team.wins + team.losses).toBeLessThanOrEqual(team.totalGames);
                expect(team.totalGames).toBe(2);
            }
        });
    });

    // =========================================================================
    // Error handling
    // =========================================================================
    describe('error handling', () => {
        it('should return 500 on database error', async () => {
            mockSql.mockImplementation(() => {
                return Promise.reject(new Error('Connection failed'));
            });

            const res = await GET(new NextRequest('http://localhost/api/team-performance'));
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBe('Failed to fetch team performance data');
        });
    });
});
