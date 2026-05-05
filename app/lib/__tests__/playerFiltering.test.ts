import { getPlayerThreshold } from '../playerFiltering';
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
