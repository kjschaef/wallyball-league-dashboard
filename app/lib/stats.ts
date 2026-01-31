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
}



export async function calculatePlayerStats(
    allPlayers: unknown[],
    allMatches: unknown[],
    _sql: unknown,
    _seasonParam: string | null,
    _seasonData: unknown
): Promise<PlayerStats[]> {
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

            // Process matches to determine wins/losses for this player
            const processedMatches = playerMatches.map(match => {
                const isTeamOne = match.team_one_player_one_id === player.id ||
                    match.team_one_player_two_id === player.id ||
                    match.team_one_player_three_id === player.id;

                const won = isTeamOne
                    ? match.team_one_games_won > match.team_two_games_won
                    : match.team_two_games_won > match.team_one_games_won;

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
            const startYear = player.start_year || createdAt.getFullYear();
            const currentYear = new Date().getFullYear();
            const yearsPlayed = Math.max(1, currentYear - startYear);

            // Calculate total playing time (90 minutes per unique day played)
            const uniqueDays = new Set(processedMatches.map(match => {
                const date = new Date(match.date);
                return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }));
            const totalPlayingTime = Math.round((uniqueDays.size * 90) / 60); // Convert to hours



            // Calculate win percentage
            const winPercentage = gamesWon + gamesLost > 0 ? (gamesWon / (gamesWon + gamesLost)) * 100 : 0;

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

                actualWinPercentage: winPercentage
            };
        } catch (error) {
            console.error(`Error processing player ${player.name} (ID ${player.id}):`, error);
            // Return a minimal stats object so the player still appears
            return {
                id: player.id,
                name: player.name,
                yearsPlayed: 1,
                record: { wins: 0, losses: 0, totalGames: 0 },
                winPercentage: 0,
                totalPlayingTime: 0,

                actualWinPercentage: 0
            };
        }
    }));

    // Sort by win percentage descending
    playerStats.sort((a, b) => b.winPercentage - a.winPercentage);

    return playerStats;
}
