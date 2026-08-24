/**
 * Elo Rating Module for Wallyball League
 * Implements Team-Average Elo with:
 * - Dynamic Tiered K-Factor based on career games played
 * - Margin-of-Victory (MOV) scaling for scored games
 * - Chronological match replay for lifetime career ratings
 */

export const INITIAL_ELO = 1500;
export const PROVISIONAL_THRESHOLD = 10;

export interface PlayerEloState {
  id: number;
  name?: string;
  elo: number;
  careerGames: number;
  isProvisional: boolean;
}

export interface MatchGameScore {
  gameNumber: number;
  teamOneScore: number;
  teamTwoScore: number;
}

export interface ReplayMatch {
  id: number;
  team_one_player_one_id?: number | null;
  team_one_player_two_id?: number | null;
  team_one_player_three_id?: number | null;
  team_two_player_one_id?: number | null;
  team_two_player_two_id?: number | null;
  team_two_player_three_id?: number | null;
  teamOnePlayerOneId?: number | null;
  teamOnePlayerTwoId?: number | null;
  teamOnePlayerThreeId?: number | null;
  teamTwoPlayerOneId?: number | null;
  teamTwoPlayerTwoId?: number | null;
  teamTwoPlayerThreeId?: number | null;
  team_one_games_won?: number | null;
  team_two_games_won?: number | null;
  teamOneGamesWon?: number | null;
  teamTwoGamesWon?: number | null;
  date?: string | Date | null;
  gameScores?: MatchGameScore[];
  game_scores?: MatchGameScore[];
}

/**
 * Returns the K-factor based on career games played.
 * - Provisional (< 10 games): 48
 * - Established (10-30 games): 32
 * - Veteran (> 30 games): 24
 */
export function getKFactor(careerGames: number): number {
  if (careerGames < 10) return 48;
  if (careerGames <= 30) return 32;
  return 24;
}

/**
 * Calculates logarithmic margin of victory multiplier.
 * Formula: ln(|margin| + 1) * 0.6
 * Falls back to 1.0 (neutral) when scores are missing.
 */
export function calculateMarginMultiplier(teamOneScore?: number | null, teamTwoScore?: number | null): number {
  if (typeof teamOneScore !== 'number' || typeof teamTwoScore !== 'number' || isNaN(teamOneScore) || isNaN(teamTwoScore)) {
    return 1.0;
  }
  const margin = Math.abs(teamOneScore - teamTwoScore);
  // Logarithmic scaling with a 0.6 factor:
  // margin 2: ln(3) * 0.6 ≈ 0.66
  // margin 5: ln(6) * 0.6 ≈ 1.07
  // margin 10: ln(11) * 0.6 ≈ 1.44
  const multiplier = Math.log(margin + 1) * 0.6;
  // Bound multiplier between 0.5 and 2.0 to prevent runaway distortion
  return Math.max(0.5, Math.min(2.0, multiplier));
}

/**
 * Calculates the arithmetic mean Elo for a team of active player IDs.
 */
export function calculateTeamAverageElo(playerIds: number[], ratingsMap: Map<number, PlayerEloState>): number {
  const validRatings = playerIds
    .map(id => ratingsMap.get(id)?.elo ?? INITIAL_ELO);

  if (validRatings.length === 0) return INITIAL_ELO;
  const sum = validRatings.reduce((acc, r) => acc + r, 0);
  return sum / validRatings.length;
}

/**
 * Calculates expected win probability for Team A vs Team B.
 */
export function calculateExpectedWinRate(teamRatingA: number, teamRatingB: number): number {
  return 1 / (1 + Math.pow(10, (teamRatingB - teamRatingA) / 400));
}

/**
 * Extracts non-null player IDs for team one and team two from a match record.
 */
export function extractTeamPlayerIds(match: ReplayMatch): { teamOnePlayerIds: number[]; teamTwoPlayerIds: number[] } {
  const t1 = [
    match.team_one_player_one_id ?? match.teamOnePlayerOneId,
    match.team_one_player_two_id ?? match.teamOnePlayerTwoId,
    match.team_one_player_three_id ?? match.teamOnePlayerThreeId,
  ].filter((id): id is number => typeof id === 'number' && id !== null && id > 0);

  const t2 = [
    match.team_two_player_one_id ?? match.teamTwoPlayerOneId,
    match.team_two_player_two_id ?? match.teamTwoPlayerTwoId,
    match.team_two_player_three_id ?? match.teamTwoPlayerThreeId,
  ].filter((id): id is number => typeof id === 'number' && id !== null && id > 0);

  return { teamOnePlayerIds: t1, teamTwoPlayerIds: t2 };
}

/**
 * Computes lifetime Elo ratings for all players by replaying matches chronologically.
 */
export function computeChronologicalElo(
  allPlayers: Array<{ id: number; name?: string }>,
  allMatches: ReplayMatch[],
  gamesMap?: Map<number, MatchGameScore[]>
): Map<number, PlayerEloState> {
  const ratingsMap = new Map<number, PlayerEloState>();

  // Initialize all players with starting Elo
  for (const player of allPlayers) {
    ratingsMap.set(player.id, {
      id: player.id,
      name: player.name,
      elo: INITIAL_ELO,
      careerGames: 0,
      isProvisional: true,
    });
  }

  // Sort matches chronologically (oldest to newest)
  const sortedMatches = [...allMatches].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return (a.id ?? 0) - (b.id ?? 0);
  });

  for (const match of sortedMatches) {
    const { teamOnePlayerIds, teamTwoPlayerIds } = extractTeamPlayerIds(match);

    // Skip match if either team has no players
    if (teamOnePlayerIds.length === 0 || teamTwoPlayerIds.length === 0) {
      continue;
    }

    // Ensure any players not in initial list are initialized
    for (const pid of [...teamOnePlayerIds, ...teamTwoPlayerIds]) {
      if (!ratingsMap.has(pid)) {
        ratingsMap.set(pid, {
          id: pid,
          elo: INITIAL_ELO,
          careerGames: 0,
          isProvisional: true,
        });
      }
    }

    const t1Wins = match.team_one_games_won ?? match.teamOneGamesWon ?? 0;
    const t2Wins = match.team_two_games_won ?? match.teamTwoGamesWon ?? 0;
    const totalGamesInMatch = t1Wins + t2Wins;

    if (totalGamesInMatch === 0) continue;

    // Get individual game scores if available
    const scoredGames = match.gameScores || match.game_scores || (gamesMap ? gamesMap.get(match.id) : undefined) || [];

    // Replay each individual game within the match
    for (let gIndex = 0; gIndex < totalGamesInMatch; gIndex++) {
      const teamOneAvgElo = calculateTeamAverageElo(teamOnePlayerIds, ratingsMap);
      const teamTwoAvgElo = calculateTeamAverageElo(teamTwoPlayerIds, ratingsMap);

      const expectedT1 = calculateExpectedWinRate(teamOneAvgElo, teamTwoAvgElo);
      const expectedT2 = 1 - expectedT1;

      // Determine game winner: use game score if available, else first t1Wins games won by T1
      let t1WonGame: boolean;
      const gameScore: MatchGameScore | undefined = scoredGames[gIndex];

      if (gameScore && typeof gameScore.teamOneScore === 'number' && typeof gameScore.teamTwoScore === 'number') {
        t1WonGame = gameScore.teamOneScore > gameScore.teamTwoScore;
      } else {
        // Fallback: games 0..(t1Wins-1) won by Team 1, remainder won by Team 2
        t1WonGame = gIndex < t1Wins;
      }

      const actualT1 = t1WonGame ? 1 : 0;
      const actualT2 = t1WonGame ? 0 : 1;

      const marginMultiplier = calculateMarginMultiplier(
        gameScore?.teamOneScore,
        gameScore?.teamTwoScore
      );

      // Apply rating updates to Team 1 players
      for (const pid of teamOnePlayerIds) {
        const state = ratingsMap.get(pid)!;
        const k = getKFactor(state.careerGames);
        const delta = k * (actualT1 - expectedT1) * marginMultiplier;
        state.elo = Math.round((state.elo + delta) * 100) / 100;
        state.careerGames += 1;
        state.isProvisional = state.careerGames < PROVISIONAL_THRESHOLD;
      }

      // Apply rating updates to Team 2 players
      for (const pid of teamTwoPlayerIds) {
        const state = ratingsMap.get(pid)!;
        const k = getKFactor(state.careerGames);
        const delta = k * (actualT2 - expectedT2) * marginMultiplier;
        state.elo = Math.round((state.elo + delta) * 100) / 100;
        state.careerGames += 1;
        state.isProvisional = state.careerGames < PROVISIONAL_THRESHOLD;
      }
    }
  }

  return ratingsMap;
}
