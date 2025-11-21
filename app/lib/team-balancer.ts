import { PlayerStats, TeamSuggestion } from './types';

/**
 * Generates balanced team matchups using a deterministic algorithm.
 * 
 * @param availablePlayers List of players available for the match
 * @returns Array of 3 distinct team scenarios sorted by balance
 */
export function generateBalancedTeams(availablePlayers: PlayerStats[]): TeamSuggestion[] {
    if (availablePlayers.length < 4) {
        return [];
    }

    // Determine team sizes
    const totalPlayers = availablePlayers.length;
    const team1Size = Math.floor(totalPlayers / 2);
    const team2Size = totalPlayers - team1Size;

    // Generate all valid combinations for Team 1
    const combinations = getCombinations(availablePlayers, team1Size);

    // Calculate stats for each combination and its complement (Team 2)
    // Calculate stats for each combination and its complement (Team 2)
    const scenarios: TeamSuggestion[] = [];
    const seenMatchups = new Set<string>();

    combinations.forEach(teamOne => {
        const teamOneIds = new Set(teamOne.map(p => p.id));
        const teamTwo = availablePlayers.filter(p => !teamOneIds.has(p.id));

        // Create a unique key for this matchup to prevent duplicates (e.g. A vs B is same as B vs A)
        const t1Key = teamOne.map(p => p.id).sort((a, b) => a - b).join(',');
        const t2Key = teamTwo.map(p => p.id).sort((a, b) => a - b).join(',');
        const matchupKey = [t1Key, t2Key].sort().join('|');

        if (seenMatchups.has(matchupKey)) {
            return;
        }
        seenMatchups.add(matchupKey);

        const team1WinPct = calculateAverageWinPct(teamOne);
        const team2WinPct = calculateAverageWinPct(teamTwo);

        const diff = Math.abs(team1WinPct - team2WinPct);
        const balanceScore = Math.max(0, 100 - (diff * 2)); // 100 = perfect balance, drops as diff increases

        // Simple win probability estimation
        const expectedWinProbability = 50 + (team1WinPct - team2WinPct) / 2;

        scenarios.push({
            teamOne,
            teamTwo,
            balanceScore: Math.round(balanceScore),
            expectedWinProbability: Math.round(expectedWinProbability),
            reasoning: '', // Will be filled later
            diff // Store for sorting
        } as any);
    });

    // Sort by balance (closest to 0 diff)
    scenarios.sort((a: any, b: any) => a.diff - b.diff);

    // Select top 3 distinct scenarios
    // For small player counts, we might not have 3 distinct valid scenarios that make sense
    // But we'll try to pick the best ones.

    // Strategy:
    // 1. Best Balance: The mathematically closest match
    // 2. Power Match: Teams with highest combined win % (if different from #1)
    // 3. Underdog/Mixed: Another balanced variation

    const topScenarios = scenarios.slice(0, 3).map((s, index) => {
        let scenarioName = "Balanced Matchup";
        let reasoning = `Teams are evenly matched with a ${s.balanceScore}% balance score.`;

        if (index === 0) {
            scenarioName = "Most Balanced";
            reasoning = `Mathematically optimized for the closest possible match. Team 1 Avg: ${calculateAverageWinPct(s.teamOne).toFixed(1)}%, Team 2 Avg: ${calculateAverageWinPct(s.teamTwo).toFixed(1)}%.`;
        } else if (index === 1) {
            scenarioName = "Alternative Balance";
            reasoning = `A strong alternative configuration with ${s.balanceScore}% balance score.`;
        } else {
            scenarioName = "Variation";
            reasoning = `Another competitive setup to consider.`;
        }

        return {
            scenario: scenarioName,
            teamOne: s.teamOne,
            teamTwo: s.teamTwo,
            balanceScore: s.balanceScore,
            expectedWinProbability: s.expectedWinProbability,
            reasoning
        };
    });

    return topScenarios;
}

function calculateAverageWinPct(players: PlayerStats[]): number {
    if (players.length === 0) return 0;
    const sum = players.reduce((acc, p) => acc + (p.actualWinPercentage ?? p.winPercentage), 0);
    return sum / players.length;
}

function getCombinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (arr.length === k) return [arr];
    if (arr.length < k) return [];

    const [first, ...rest] = arr;

    const combsWithFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
    const combsWithoutFirst = getCombinations(rest, k);

    return [...combsWithFirst, ...combsWithoutFirst];
}
