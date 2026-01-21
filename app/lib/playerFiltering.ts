import { MINIMUM_GAMES_THRESHOLD } from './constants';

interface PlayerWithGames {
    record?: {
        totalGames: number;
    };
}

export const getPlayerThreshold = (players: PlayerWithGames[], showAllPlayers: boolean): number => {
    if (showAllPlayers) return 1;
    const count50 = players.filter(p => (p.record?.totalGames ?? 0) >= MINIMUM_GAMES_THRESHOLD).length;
    return count50 > 0 ? MINIMUM_GAMES_THRESHOLD : 1;
};
