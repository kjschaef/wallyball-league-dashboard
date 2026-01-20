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
    streak: {
        type: 'activity';
        count: number;
    };
    actualWinPercentage?: number;
}

function calculateStreak(matches: Array<{ won: boolean; date: string }>): { type: 'activity'; count: number } {
    if (matches.length === 0) return { type: 'activity', count: 0 };

    // Group matches by week (using ISO week format YYYY-MM-DD for Monday of each week)
    const matchesByWeek = new Set<string>();

    for (const match of matches) {
        const matchDate = new Date(match.date);
        // Get Monday of the week containing this match
        const monday = new Date(matchDate);
        const dayOfWeek = matchDate.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Handle Sunday (0) as 6 days from Monday
        monday.setDate(matchDate.getDate() - daysToSubtract);
        monday.setHours(0, 0, 0, 0);

        const weekKey = monday.toISOString().split('T')[0];
        matchesByWeek.add(weekKey);
    }

    // Convert to sorted array (oldest first for streak calculation)
    const sortedWeeks = Array.from(matchesByWeek).sort((a, b) => a.localeCompare(b));

    if (sortedWeeks.length === 0) return { type: 'activity', count: 0 };
    if (sortedWeeks.length === 1) return { type: 'activity', count: 1 };

    // Find the longest consecutive streak of weeks
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedWeeks.length; i++) {
        const currentWeek = new Date(sortedWeeks[i]);
        const previousWeek = new Date(sortedWeeks[i - 1]);

        // Check if current week is exactly 7 days after previous week
        const expectedCurrentWeek = new Date(previousWeek);
        expectedCurrentWeek.setDate(expectedCurrentWeek.getDate() + 7);

        if (currentWeek.getTime() === expectedCurrentWeek.getTime()) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1; // Reset streak
        }
    }

    return {
        type: 'activity', // Counting consecutive weeks of activity
        count: maxStreak
    };
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

            // Calculate streak
            const streak = calculateStreak(processedMatches);

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
                streak,
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
                streak: { type: 'activity' as const, count: 0 },
                actualWinPercentage: 0
            };
        }
    }));

    // Sort by win percentage descending
    playerStats.sort((a, b) => b.winPercentage - a.winPercentage);

    return playerStats;
}
