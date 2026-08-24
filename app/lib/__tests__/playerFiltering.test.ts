import { getPlayerThreshold, isPlayerActive } from '../playerFiltering';
import { MINIMUM_GAMES_THRESHOLD } from '../constants';

describe('getPlayerThreshold', () => {
    it('returns 1 if showAllPlayers is true, regardless of players array', () => {
        expect(getPlayerThreshold([{ record: { totalGames: 100 } }], true)).toBe(1);
    });

    it('returns 1 if players array is empty', () => {
        expect(getPlayerThreshold([], false)).toBe(1);
    });

    it('returns 1 if players is not an array', () => {
        // @ts-expect-error - testing invalid input
        expect(getPlayerThreshold(null, false)).toBe(1);
        // @ts-expect-error - testing invalid input
        expect(getPlayerThreshold(undefined, false)).toBe(1);
    });

    it('returns 1 if no players meet the MINIMUM_GAMES_THRESHOLD', () => {
        const players = [
            { record: { totalGames: MINIMUM_GAMES_THRESHOLD - 1 } },
            { record: { totalGames: 0 } },
            {} // testing missing record
        ];
        expect(getPlayerThreshold(players, false)).toBe(1);
    });

    it('returns MINIMUM_GAMES_THRESHOLD if at least one player meets the threshold', () => {
        const players = [
            { record: { totalGames: MINIMUM_GAMES_THRESHOLD - 1 } },
            { record: { totalGames: MINIMUM_GAMES_THRESHOLD } },
        ];
        expect(getPlayerThreshold(players, false)).toBe(MINIMUM_GAMES_THRESHOLD);
    });

    it('returns MINIMUM_GAMES_THRESHOLD if multiple players meet the threshold', () => {
        const players = [
            { record: { totalGames: MINIMUM_GAMES_THRESHOLD + 10 } },
            { record: { totalGames: MINIMUM_GAMES_THRESHOLD + 20 } },
        ];
        expect(getPlayerThreshold(players, false)).toBe(MINIMUM_GAMES_THRESHOLD);
    });
});

describe('isPlayerActive', () => {
    const referenceDate = new Date('2026-08-24T12:00:00.000Z');

    it('returns false when lastGameDate is null, undefined, or empty', () => {
        expect(isPlayerActive(null, referenceDate)).toBe(false);
        expect(isPlayerActive(undefined, referenceDate)).toBe(false);
        expect(isPlayerActive('', referenceDate)).toBe(false);
    });

    it('returns true when lastGameDate is within the last 6 months', () => {
        // 1 month ago
        const recentDate = new Date('2026-07-24T12:00:00.000Z').toISOString();
        expect(isPlayerActive(recentDate, referenceDate)).toBe(true);

        // Same day
        expect(isPlayerActive(referenceDate.toISOString(), referenceDate)).toBe(true);
    });

    it('returns false when lastGameDate is more than 6 months ago', () => {
        // 7 months ago
        const oldDate = new Date('2026-01-10T12:00:00.000Z').toISOString();
        expect(isPlayerActive(oldDate, referenceDate)).toBe(false);
    });
});

