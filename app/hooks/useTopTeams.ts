import { useQuery } from '@tanstack/react-query';
import { MINIMUM_TEAM_GAMES_THRESHOLD, TOP_TEAMS_PER_SEASON } from '../lib/constants';

interface Season {
    id: number;
    name: string;
    is_active?: boolean;
}

interface TeamPerformance {
    id: number;
    players: string[];
    wins: number;
    losses: number;
    winPercentage: number;
    totalGames: number;
    gameWins: number;
    gameLosses: number;
    totalIndividualGames: number;
    gameWinPercentage: number;
}

export interface SeasonTopTeams {
    seasonId: number;
    seasonName: string;
    teams: TeamPerformance[];
    status: 'complete' | 'incomplete';
}

export function useTopTeams() {
    return useQuery({
        queryKey: ['top-teams-by-season'],
        queryFn: async (): Promise<SeasonTopTeams[]> => {
            const seasonsRes = await fetch('/api/seasons');
            if (!seasonsRes.ok) throw new Error('Failed to fetch seasons');
            const seasons: Season[] = await seasonsRes.json();

            // Only process quarterly seasons (not annual or lifetime)
            const quarterlySeasons = seasons.filter(s => /^\d{4} Q\d$/.test(s.name));

            const results = await Promise.all(quarterlySeasons.map(async (season): Promise<SeasonTopTeams | null> => {
                if (season.is_active) {
                    return {
                        seasonId: season.id,
                        seasonName: season.name,
                        teams: [],
                        status: 'incomplete',
                    };
                }

                try {
                    const res = await fetch(`/api/team-performance?season=${season.id}`);
                    if (!res.ok) {
                        console.warn(`Failed to fetch team performance for season ${season.name}: ${res.status}`);
                        return null;
                    }
                    const teams: TeamPerformance[] = await res.json();

                    const qualified = teams
                        .filter(t => t.totalIndividualGames >= MINIMUM_TEAM_GAMES_THRESHOLD)
                        .sort((a, b) => b.gameWinPercentage - a.gameWinPercentage)
                        .slice(0, TOP_TEAMS_PER_SEASON);

                    return {
                        seasonId: season.id,
                        seasonName: season.name,
                        teams: qualified,
                        status: 'complete',
                    };
                } catch (e) {
                    console.warn(`Error fetching team performance for season ${season.name}:`, e);
                    return null;
                }
            }));

            return results
                .filter((r): r is SeasonTopTeams => r !== null)
                .sort((a, b) => b.seasonId - a.seasonId);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
