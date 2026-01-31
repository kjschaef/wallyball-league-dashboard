import { useQuery } from '@tanstack/react-query';
import { getPlayerThreshold } from '../lib/playerFiltering';

interface Season {
    id: number;
    name: string;
    is_active?: boolean;
    end_date?: string;
}

interface PlayerStats {
    id: number;
    name: string;
    record: {
        wins: number;
        losses: number;
        totalGames: number;
        winPercentage: number;
    };
    winPercentage: number;
}

export interface Winner {
    seasonId: number;
    seasonName: string;
    player: PlayerStats | null; // null if TBD/Incomplete
    isAnnual: boolean;
    status: 'complete' | 'incomplete';
}

export function useSeasonChampions() {
    return useQuery({
        queryKey: ['season-champions'],
        queryFn: async (): Promise<Winner[]> => {
            const seasonsRes = await fetch('/api/seasons');
            if (!seasonsRes.ok) throw new Error('Failed to fetch seasons');
            const seasons: Season[] = await seasonsRes.json();

            const winnersData: Winner[] = [];

            await Promise.all(seasons.map(async (season) => {
                const isAnnual = /^\d{4}$/.test(season.name);
                const currentYear = new Date().getFullYear();
                const seasonYear = parseInt(season.name) || 0;

                let status: 'complete' | 'incomplete' = 'complete';

                if (season.is_active) {
                    status = 'incomplete';
                } else if (isAnnual && seasonYear >= currentYear) {
                    status = 'incomplete';
                }

                if (status === 'incomplete') {
                    winnersData.push({
                        seasonId: season.id,
                        seasonName: season.name,
                        player: null,
                        isAnnual,
                        status
                    });
                    return;
                }

                try {
                    const statsRes = await fetch(`/api/player-stats?season=${season.id}`);
                    if (!statsRes.ok) return;
                    const stats: PlayerStats[] = await statsRes.json();

                    const threshold = getPlayerThreshold(stats, false);
                    const eligiblePlayers = stats.filter(p => (p.record?.totalGames ?? 0) >= threshold);
                    const sortedPlayers = eligiblePlayers.sort((a, b) => b.winPercentage - a.winPercentage);

                    if (sortedPlayers.length > 0) {
                        winnersData.push({
                            seasonId: season.id,
                            seasonName: season.name,
                            player: sortedPlayers[0],
                            isAnnual,
                            status: 'complete'
                        });
                    }
                } catch (e) {
                    console.error(`Failed to fetch stats for season ${season.name}`, e);
                }
            }));

            return winnersData.sort((a, b) => b.seasonId - a.seasonId);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
