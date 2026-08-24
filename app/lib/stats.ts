import { computeChronologicalElo, INITIAL_ELO } from './elo';

export interface PlayerStats {
    id: number;
    name: string;
    yearsPlayed: number;
    record: {
        wins: number;
        losses: number;
        totalGames: number;
    };
    winPercentage: number;
    totalPlayingTime: number;

    actualWinPercentage?: number;
    lastGameDate?: string | null;

    // Supplemental point metrics from scored games
    pointDifferential: number;
    pointsScored: number;
    pointsAllowed: number;
    avgPointsScored: number;
    avgPointsAllowed: number;
    scoredGamesPlayed: number;

    // Career Elo rating metrics
    elo: number;
    isProvisional: boolean;
    careerGames: number;
}

export async function calculatePlayerStats(
    allPlayers: unknown[],
    allMatches: unknown[],
    _sql: unknown,
    _seasonParam: string | null,
    _seasonData: unknown
): Promise<PlayerStats[]> {
    const gamesMap = new Map<number, Array<{ gameNumber: number; teamOneScore: number; teamTwoScore: number }>>();
    if (_sql && typeof (_sql as any) === 'function') {
        try {
            const allMatchGames = await (_sql as any)`SELECT match_id, game_number, team_one_score, team_two_score FROM match_games ORDER BY match_id, game_number ASC`;
            if (Array.isArray(allMatchGames)) {
                for (const mg of allMatchGames) {
                    if (!gamesMap.has(mg.match_id)) {
                        gamesMap.set(mg.match_id, []);
                    }
                    gamesMap.get(mg.match_id)!.push({
                        gameNumber: mg.game_number,
                        teamOneScore: mg.team_one_score,
                        teamTwoScore: mg.team_two_score,
                    });
                }
            }
        } catch {
            // In case table is not populated yet or test environment
        }
    }

    // Determine lifetime matches for career Elo replay
    let lifetimeMatches = allMatches;
    if (_sql && typeof (_sql as any) === 'function' && _seasonParam) {
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const rows = await (_sql as any)`SELECT * FROM matches WHERE date <= ${tomorrow} ORDER BY date ASC, id ASC`;
            if (Array.isArray(rows) && rows.length > 0) {
                lifetimeMatches = rows;
            }
        } catch {
            // Fallback to allMatches
        }
    }

    const eloMap = computeChronologicalElo(
        (allPlayers as any[]) || [],
        (lifetimeMatches as any[]) || [],
        gamesMap
    );

    const playerStats: PlayerStats[] = await Promise.all((allPlayers as any[]).map(async player => {
        try {
            // Find matches where this player participated
            const playerMatches = (allMatches as any[]).filter(match =>
                match.team_one_player_one_id === player.id ||
                match.team_one_player_two_id === player.id ||
                match.team_one_player_three_id === player.id ||
                match.team_two_player_one_id === player.id ||
                match.team_two_player_two_id === player.id ||
                match.team_two_player_three_id === player.id
            );

            // Process matches to determine wins/losses and point metrics for this player
            let pointsScored = 0;
            let pointsAllowed = 0;
            let scoredGamesPlayed = 0;

            const processedMatches = playerMatches.map(match => {
                const isTeamOne = match.team_one_player_one_id === player.id ||
                    match.team_one_player_two_id === player.id ||
                    match.team_one_player_three_id === player.id;

                const won = isTeamOne
                    ? match.team_one_games_won > match.team_two_games_won
                    : match.team_two_games_won > match.team_one_games_won;

                const matchScores = match.gameScores || match.game_scores || gamesMap.get(match.id) || [];
                for (const gs of matchScores) {
                    const scored = isTeamOne ? (gs.teamOneScore ?? gs.team_one_score) : (gs.teamTwoScore ?? gs.team_two_score);
                    const allowed = isTeamOne ? (gs.teamTwoScore ?? gs.team_two_score) : (gs.teamOneScore ?? gs.team_one_score);
                    if (typeof scored === 'number' && typeof allowed === 'number') {
                        pointsScored += scored;
                        pointsAllowed += allowed;
                        scoredGamesPlayed += 1;
                    }
                }

                return {
                    won,
                    date: match.date ? new Date(match.date).toISOString() : new Date().toISOString(),
                    teamOneGamesWon: match.team_one_games_won,
                    teamTwoGamesWon: match.team_two_games_won,
                    isTeamOne
                };
            });

            // Calculate games won/lost (not matches won/lost)
            const gamesWon = processedMatches.reduce((total, match) => {
                return total + (match.isTeamOne ? match.teamOneGamesWon : match.teamTwoGamesWon);
            }, 0);

            const gamesLost = processedMatches.reduce((total, match) => {
                return total + (match.isTeamOne ? match.teamTwoGamesWon : match.teamOneGamesWon);
            }, 0);

            const totalGames = gamesWon + gamesLost;

            // Calculate years played
            const createdAt = player.created_at ? new Date(player.created_at) : new Date();
            const startYear = player.start_year || createdAt.getUTCFullYear();
            const currentYear = new Date().getUTCFullYear();
            const yearsPlayed = Math.max(1, currentYear - startYear);

            // Calculate total playing time (90 minutes per unique day played)
            const uniqueDays = new Set(processedMatches.map(match => {
                const date = new Date(match.date);
                return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }));
            const totalPlayingTime = Math.round((uniqueDays.size * 90) / 60); // Convert to hours

            // Calculate win percentage
            const winPercentage = gamesWon + gamesLost > 0 ? (gamesWon / (gamesWon + gamesLost)) * 100 : 0;

            const lastGameDate = processedMatches.length > 0
                ? new Date(Math.max(...processedMatches.map(m => new Date(m.date).getTime()))).toISOString()
                : null;

            const pointDifferential = pointsScored - pointsAllowed;
            const avgPointsScored = scoredGamesPlayed > 0 ? Number((pointsScored / scoredGamesPlayed).toFixed(1)) : 0;
            const avgPointsAllowed = scoredGamesPlayed > 0 ? Number((pointsAllowed / scoredGamesPlayed).toFixed(1)) : 0;

            const eloState = eloMap.get(player.id);
            const elo = eloState ? Math.round(eloState.elo) : INITIAL_ELO;
            const isProvisional = eloState ? eloState.isProvisional : true;
            const careerGames = eloState ? eloState.careerGames : 0;

            return {
                id: player.id,
                name: player.name,
                yearsPlayed,
                record: {
                    wins: gamesWon,
                    losses: gamesLost,
                    totalGames
                },
                winPercentage,
                totalPlayingTime,

                actualWinPercentage: winPercentage,
                lastGameDate,

                pointDifferential,
                pointsScored,
                pointsAllowed,
                avgPointsScored,
                avgPointsAllowed,
                scoredGamesPlayed,

                elo,
                isProvisional,
                careerGames
            };
        } catch (error) {
            console.error(`Error processing player ${player.name} (ID ${player.id}):`, error);
            const eloState = eloMap.get(player.id);
            return {
                id: player.id,
                name: player.name,
                yearsPlayed: 1,
                record: { wins: 0, losses: 0, totalGames: 0 },
                winPercentage: 0,
                totalPlayingTime: 0,

                actualWinPercentage: 0,
                lastGameDate: null,

                pointDifferential: 0,
                pointsScored: 0,
                pointsAllowed: 0,
                avgPointsScored: 0,
                avgPointsAllowed: 0,
                scoredGamesPlayed: 0,

                elo: eloState ? Math.round(eloState.elo) : INITIAL_ELO,
                isProvisional: eloState ? eloState.isProvisional : true,
                careerGames: eloState ? eloState.careerGames : 0
            };
        }
    }));

    // Sort by win percentage descending
    playerStats.sort((a, b) => b.winPercentage - a.winPercentage);

    return playerStats;
}
