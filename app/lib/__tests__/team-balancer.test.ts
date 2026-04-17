import { generateBalancedTeams } from '../team-balancer';
import { PlayerStats } from '../types';

const mockPlayers: PlayerStats[] = [
    { id: 1, name: 'P1', winPercentage: 80, record: { wins: 8, losses: 2, totalGames: 10 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 2, name: 'P2', winPercentage: 60, record: { wins: 6, losses: 4, totalGames: 10 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 3, name: 'P3', winPercentage: 40, record: { wins: 4, losses: 6, totalGames: 10 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 4, name: 'P4', winPercentage: 20, record: { wins: 2, losses: 8, totalGames: 10 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 5, name: 'P5', winPercentage: 70, record: { wins: 7, losses: 3, totalGames: 10 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 6, name: 'P6', winPercentage: 30, record: { wins: 3, losses: 7, totalGames: 10 }, yearsPlayed: 1, totalPlayingTime: 100 },
];

describe('generateBalancedTeams', () => {
    describe('edge cases (less than 4 players)', () => {
        it('returns an empty array when given an empty list of players', () => {
            expect(generateBalancedTeams([])).toEqual([]);
        });

        it('returns an empty array when given 1 player', () => {
            expect(generateBalancedTeams([mockPlayers[0]])).toEqual([]);
        });

        it('returns an empty array when given 2 players', () => {
            expect(generateBalancedTeams([mockPlayers[0], mockPlayers[1]])).toEqual([]);
        });

        it('returns an empty array when given 3 players', () => {
            expect(generateBalancedTeams([mockPlayers[0], mockPlayers[1], mockPlayers[2]])).toEqual([]);
        });
    });

    describe('standard cases', () => {
        it('generates scenarios when given 4 players', () => {
            const results = generateBalancedTeams(mockPlayers.slice(0, 4));
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('scenario');
            expect(results[0]).toHaveProperty('teamOne');
            expect(results[0]).toHaveProperty('teamTwo');
            expect(results[0]).toHaveProperty('balanceScore');
            expect(results[0]).toHaveProperty('expectedWinProbability');
            expect(results[0]).toHaveProperty('reasoning');
        });

        it('generates up to 3 scenarios when given 6 players', () => {
            const results = generateBalancedTeams(mockPlayers);
            expect(results.length).toBeLessThanOrEqual(3);
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('determinism', () => {
        it('returns the same results for the same input', () => {
            const players = mockPlayers.slice(0, 5);
            const results1 = generateBalancedTeams(players);
            const results2 = generateBalancedTeams(players);
            expect(results1).toEqual(results2);
        });
    });

    describe('scenario properties', () => {
        it('assigns correct scenario names based on index', () => {
            const results = generateBalancedTeams(mockPlayers);
            if (results.length > 0) expect(results[0].scenario).toBe('Most Balanced');
            if (results.length > 1) expect(results[1].scenario).toBe('Alternative Balance');
            if (results.length > 2) expect(results[2].scenario).toBe('Variation');
        });
    });
});
