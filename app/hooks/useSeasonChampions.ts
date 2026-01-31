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

// Validate year is reasonable (2000-2100)
const isValidYear = (year: number): boolean => {
    return !isNaN(year) && year >= 2000 && year <= 2100;
};

export function useSeasonChampions() {
    return useQuery({
        queryKey: ['season-champions'],
        queryFn: async (): Promise<Winner[]> => {
            const seasonsRes = await fetch('/api/seasons');
            if (!seasonsRes.ok) throw new Error('Failed to fetch seasons');
            const seasons: Season[] = await seasonsRes.json();

            const currentYear = new Date().getFullYear();

            // Use Promise.all with return values instead of mutating array
            const results = await Promise.all(seasons.map(async (season): Promise<Winner | null> => {
                const yearMatch = /^\d{4}$/.test(season.name);
                const seasonYear = parseInt(season.name, 10);
                const isAnnual = yearMatch && isValidYear(seasonYear);

                let status: 'complete' | 'incomplete' = 'complete';

                if (season.is_active) {
                    status = 'incomplete';
                } else if (isAnnual && seasonYear >= currentYear) {
                    status = 'incomplete';
                }

                if (status === 'incomplete') {
                    return {
                        seasonId: season.id,
                        seasonName: season.name,
                        player: null,
                        isAnnual,
                        status
                    };
                }

                try {
                    const statsRes = await fetch(`/api/player-stats?season=${season.id}`);
                    if (!statsRes.ok) {
                        console.warn(`Failed to fetch stats for season ${season.name}: ${statsRes.status}`);
                        return null;
                    }
                    const stats: PlayerStats[] = await statsRes.json();

                    const threshold = getPlayerThreshold(stats, false);
                    if (typeof threshold !== 'number' || isNaN(threshold)) {
                        console.warn(`Invalid threshold for season ${season.name}`);
                        return null;
                    }

                    const eligiblePlayers = stats.filter(p => (p.record?.totalGames ?? 0) >= threshold);
                    const sortedPlayers = eligiblePlayers.sort((a, b) => b.winPercentage - a.winPercentage);

                    if (sortedPlayers.length > 0) {
                        return {
                            seasonId: season.id,
                            seasonName: season.name,
                            player: sortedPlayers[0],
                            isAnnual,
                            status: 'complete'
                        };
                    }
                    return null;
                } catch (e) {
                    console.warn(`Error fetching stats for season ${season.name}:`, e);
                    return null;
                }
            }));

            // Filter out nulls and sort by seasonId descending
            return results
                .filter((r): r is Winner => r !== null)
                .sort((a, b) => b.seasonId - a.seasonId);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

