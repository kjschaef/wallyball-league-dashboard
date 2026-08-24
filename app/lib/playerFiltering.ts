import { MINIMUM_GAMES_THRESHOLD } from './constants';

interface PlayerWithGames {
    record?: {
        totalGames: number;
    };
}

/**
 * Calculate the player threshold for filtering.
 * Returns MINIMUM_GAMES_THRESHOLD if any players meet it, otherwise 1.
 */
export const getPlayerThreshold = (players: PlayerWithGames[], showAllPlayers: boolean): number => {
    if (showAllPlayers) return 1;
    if (!Array.isArray(players) || players.length === 0) return 1;
    const count50 = players.filter(p => (p.record?.totalGames ?? 0) >= MINIMUM_GAMES_THRESHOLD).length;
    return count50 > 0 ? MINIMUM_GAMES_THRESHOLD : 1;
};

/**
 * Determines whether a player is active based on their last game date.
 * A player is active if they have played a match within the last 6 months.
 */
export const isPlayerActive = (lastGameDate?: string | null, referenceDate = new Date()): boolean => {
    if (!lastGameDate) return false;
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - 6);
    return new Date(lastGameDate) >= cutoff;
};


