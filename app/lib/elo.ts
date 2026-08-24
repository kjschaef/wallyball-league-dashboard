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
 * Formula: 1.0 + ln(max(1, |margin|)) * 0.35
 * Bound between 1.0 (baseline for a 1-point win or unscored match) and 2.0 (blowout cap).
 * Falls back to 1.0 (neutral) when scores are missing.
 */
export function calculateMarginMultiplier(teamOneScore?: number | null, teamTwoScore?: number | null): number {
  if (typeof teamOneScore !== 'number' || typeof teamTwoScore !== 'number' || isNaN(teamOneScore) || isNaN(teamTwoScore)) {
    return 1.0;
  }
  const margin = Math.abs(teamOneScore - teamTwoScore);
  if (margin <= 1) return 1.0;
  const multiplier = 1.0 + Math.log(margin) * 0.35;
  return Math.min(2.0, Math.max(1.0, multiplier));
}

/**
 * Chronological comparator for sorting matches from oldest to newest.
 */
export function compareMatchesChronologically(a: ReplayMatch, b: ReplayMatch): number {
  const dateA = a.date ? new Date(a.date).getTime() : 0;
  const dateB = b.date ? new Date(b.date).getTime() : 0;
  if (dateA !== dateB) return dateA - dateB;
  return (a.id ?? 0) - (b.id ?? 0);
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
  const sortedMatches = [...allMatches].sort(compareMatchesChronologically);

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

export interface SkillTier {
  name: string;
  icon: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}

export function getSkillTier(elo: number, isProvisional: boolean): SkillTier {
  if (isProvisional) {
    return {
      name: 'Provisional',
      icon: '🔰',
      color: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }
  if (elo >= 1650) {
    return {
      name: 'Diamond Tier',
      icon: '💎',
      color: 'text-blue-600',
      badgeBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
    };
  }
  if (elo >= 1525) {
    return {
      name: 'Gold Tier',
      icon: '🥇',
      color: 'text-amber-600',
      badgeBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }
  if (elo >= 1400) {
    return {
      name: 'Silver Tier',
      icon: '🥈',
      color: 'text-slate-600',
      badgeBg: 'bg-slate-50',
      borderColor: 'border-slate-200',
    };
  }
  return {
    name: 'Bronze Tier',
    icon: '🥉',
    color: 'text-amber-800',
    badgeBg: 'bg-orange-50',
    borderColor: 'border-orange-200',
  };
}

export interface WeeklyMover {
  id: number;
  name: string;
  delta: number;
  currentElo: number;
}

export interface WeeklyMoversResult {
  biggestGainer: WeeklyMover | null;
  biggestFallen: WeeklyMover | null;
  hasActivity: boolean;
  periodLabel: string;
}

/**
 * Computes weekly Elo shifts (trailing 7 days) with fallback to most recent match date.
 */
export function computeWeeklyMovers(
  allPlayers: Array<{ id: number; name: string }>,
  allMatches: ReplayMatch[],
  gamesMap?: Map<number, MatchGameScore[]>,
  days = 7
): WeeklyMoversResult {
  if (allMatches.length === 0 || allPlayers.length === 0) {
    return { biggestGainer: null, biggestFallen: null, hasActivity: false, periodLabel: 'This Week' };
  }

  const sortedMatches = [...allMatches].sort(compareMatchesChronologically);

  const latestMatchDate = sortedMatches[sortedMatches.length - 1].date
    ? new Date(sortedMatches[sortedMatches.length - 1].date!)
    : new Date();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Check if matches occurred in the last 7 days
  const recentMatches = sortedMatches.filter(m => m.date && new Date(m.date) >= sevenDaysAgo);

  let cutoffDate: Date;
  let periodLabel = 'This Week';

  if (recentMatches.length > 0) {
    cutoffDate = sevenDaysAgo;
  } else {
    // Fallback: Start of latest match date
    cutoffDate = new Date(latestMatchDate);
    cutoffDate.setHours(0, 0, 0, 0);
    periodLabel = 'Last Match Night';
  }

  // Compute baseline Elo up to cutoffDate
  const matchesBefore = sortedMatches.filter(m => m.date && new Date(m.date) < cutoffDate);
  const baselineEloMap = computeChronologicalElo(allPlayers, matchesBefore, gamesMap);

  // Compute current lifetime Elo
  const currentEloMap = computeChronologicalElo(allPlayers, sortedMatches, gamesMap);

  // Find active players since cutoffDate
  const matchesDuring = sortedMatches.filter(m => m.date && new Date(m.date) >= cutoffDate);
  const activePlayerIds = new Set<number>();
  for (const m of matchesDuring) {
    const { teamOnePlayerIds, teamTwoPlayerIds } = extractTeamPlayerIds(m);
    teamOnePlayerIds.forEach(id => activePlayerIds.add(id));
    teamTwoPlayerIds.forEach(id => activePlayerIds.add(id));
  }

  const playerNames = new Map(allPlayers.map(p => [p.id, p.name]));
  const deltas: WeeklyMover[] = [];

  for (const pid of activePlayerIds) {
    const base = baselineEloMap.get(pid)?.elo ?? INITIAL_ELO;
    const curr = currentEloMap.get(pid)?.elo ?? INITIAL_ELO;
    const delta = Math.round((curr - base) * 10) / 10;
    deltas.push({
      id: pid,
      name: playerNames.get(pid) || `Player ${pid}`,
      delta,
      currentElo: Math.round(curr),
    });
  }

  if (deltas.length === 0) {
    return { biggestGainer: null, biggestFallen: null, hasActivity: false, periodLabel };
  }

  deltas.sort((a, b) => b.delta - a.delta);

  const biggestGainer = deltas[0]?.delta > 0 ? deltas[0] : null;
  const biggestFallen = deltas[deltas.length - 1]?.delta < 0 ? deltas[deltas.length - 1] : null;

  return {
    biggestGainer,
    biggestFallen,
    hasActivity: true,
    periodLabel,
  };
}

export interface MatchEloDetails {
  matchId: number;
  teamOnePreAvg: number;
  teamTwoPreAvg: number;
  teamOneDelta: number;
  teamTwoDelta: number;
  isUpset: boolean;
  expectedT1WinRate: number;
}

/**
 * Computes match-by-match Elo details for match history lists.
 */
export function computeAllMatchesEloDetails(
  allPlayers: Array<{ id: number; name?: string }>,
  allMatches: ReplayMatch[],
  gamesMap?: Map<number, MatchGameScore[]>
): Map<number, MatchEloDetails> {
  const ratingsMap = new Map<number, PlayerEloState>();
  const matchDetailsMap = new Map<number, MatchEloDetails>();

  for (const player of allPlayers) {
    ratingsMap.set(player.id, {
      id: player.id,
      name: player.name,
      elo: INITIAL_ELO,
      careerGames: 0,
      isProvisional: true,
    });
  }

  const sortedMatches = [...allMatches].sort(compareMatchesChronologically);

  for (const match of sortedMatches) {
    const { teamOnePlayerIds, teamTwoPlayerIds } = extractTeamPlayerIds(match);

    if (teamOnePlayerIds.length === 0 || teamTwoPlayerIds.length === 0) {
      continue;
    }

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

    const teamOnePreAvg = Math.round(calculateTeamAverageElo(teamOnePlayerIds, ratingsMap));
    const teamTwoPreAvg = Math.round(calculateTeamAverageElo(teamTwoPlayerIds, ratingsMap));
    const expectedT1 = calculateExpectedWinRate(teamOnePreAvg, teamTwoPreAvg);

    const scoredGames = match.gameScores || match.game_scores || (gamesMap ? gamesMap.get(match.id) : undefined) || [];

    let matchT1NetDelta = 0;
    let matchT2NetDelta = 0;

    for (let gIndex = 0; gIndex < totalGamesInMatch; gIndex++) {
      const t1Avg = calculateTeamAverageElo(teamOnePlayerIds, ratingsMap);
      const t2Avg = calculateTeamAverageElo(teamTwoPlayerIds, ratingsMap);
      const exp1 = calculateExpectedWinRate(t1Avg, t2Avg);
      const exp2 = 1 - exp1;

      let t1WonGame: boolean;
      const gameScore: MatchGameScore | undefined = scoredGames[gIndex];

      if (gameScore && typeof gameScore.teamOneScore === 'number' && typeof gameScore.teamTwoScore === 'number') {
        t1WonGame = gameScore.teamOneScore > gameScore.teamTwoScore;
      } else {
        t1WonGame = gIndex < t1Wins;
      }

      const actualT1 = t1WonGame ? 1 : 0;
      const actualT2 = t1WonGame ? 0 : 1;
      const marginMultiplier = calculateMarginMultiplier(gameScore?.teamOneScore, gameScore?.teamTwoScore);

      for (const pid of teamOnePlayerIds) {
        const state = ratingsMap.get(pid)!;
        const k = getKFactor(state.careerGames);
        const delta = k * (actualT1 - exp1) * marginMultiplier;
        state.elo = Math.round((state.elo + delta) * 100) / 100;
        state.careerGames += 1;
        state.isProvisional = state.careerGames < PROVISIONAL_THRESHOLD;
        matchT1NetDelta += delta;
      }

      for (const pid of teamTwoPlayerIds) {
        const state = ratingsMap.get(pid)!;
        const k = getKFactor(state.careerGames);
        const delta = k * (actualT2 - exp2) * marginMultiplier;
        state.elo = Math.round((state.elo + delta) * 100) / 100;
        state.careerGames += 1;
        state.isProvisional = state.careerGames < PROVISIONAL_THRESHOLD;
        matchT2NetDelta += delta;
      }
    }

    const t1WonMatch = t1Wins > t2Wins;
    const isUpset = (t1WonMatch && teamOnePreAvg < teamTwoPreAvg - 40) ||
      (!t1WonMatch && teamTwoPreAvg < teamOnePreAvg - 40);

    const avgT1Delta = teamOnePlayerIds.length > 0 ? Math.round((matchT1NetDelta / teamOnePlayerIds.length) * 10) / 10 : 0;
    const avgT2Delta = teamTwoPlayerIds.length > 0 ? Math.round((matchT2NetDelta / teamTwoPlayerIds.length) * 10) / 10 : 0;

    matchDetailsMap.set(match.id, {
      matchId: match.id,
      teamOnePreAvg,
      teamTwoPreAvg,
      teamOneDelta: avgT1Delta,
      teamTwoDelta: avgT2Delta,
      isUpset,
      expectedT1WinRate: Number(expectedT1.toFixed(3)),
    });
  }

  return matchDetailsMap;
}

/**
 * Computes historical Elo trajectory points for each match date.
 */
export function computePlayerEloTrajectories(
  allPlayers: Array<{ id: number; name: string }>,
  allMatches: ReplayMatch[],
  gamesMap?: Map<number, MatchGameScore[]>
): Array<{ date: string; [playerName: string]: number | string }> {
  const ratingsMap = new Map<number, PlayerEloState>();
  for (const p of allPlayers) {
    ratingsMap.set(p.id, { id: p.id, name: p.name, elo: INITIAL_ELO, careerGames: 0, isProvisional: true });
  }

  const sortedMatches = [...allMatches].sort(compareMatchesChronologically);

  const trajectory: Array<{ date: string; [playerName: string]: number | string }> = [];
  const playerNames = new Map(allPlayers.map(p => [p.id, p.name]));

  // Group matches by date
  const dateGroups = new Map<string, ReplayMatch[]>();
  for (const m of sortedMatches) {
    if (!m.date) continue;
    const dStr = new Date(m.date).toISOString().split('T')[0];
    if (!dateGroups.has(dStr)) dateGroups.set(dStr, []);
    dateGroups.get(dStr)!.push(m);
  }

  for (const [dateStr, matches] of dateGroups.entries()) {
    for (const match of matches) {
      const { teamOnePlayerIds, teamTwoPlayerIds } = extractTeamPlayerIds(match);
      if (teamOnePlayerIds.length === 0 || teamTwoPlayerIds.length === 0) continue;

      for (const pid of [...teamOnePlayerIds, ...teamTwoPlayerIds]) {
        if (!ratingsMap.has(pid)) {
          ratingsMap.set(pid, { id: pid, elo: INITIAL_ELO, careerGames: 0, isProvisional: true });
        }
      }

      const t1Wins = match.team_one_games_won ?? match.teamOneGamesWon ?? 0;
      const t2Wins = match.team_two_games_won ?? match.teamTwoGamesWon ?? 0;
      const totalGames = t1Wins + t2Wins;
      const scoredGames = match.gameScores || match.game_scores || (gamesMap ? gamesMap.get(match.id) : undefined) || [];

      for (let gIndex = 0; gIndex < totalGames; gIndex++) {
        const t1Avg = calculateTeamAverageElo(teamOnePlayerIds, ratingsMap);
        const t2Avg = calculateTeamAverageElo(teamTwoPlayerIds, ratingsMap);
        const exp1 = calculateExpectedWinRate(t1Avg, t2Avg);
        const exp2 = 1 - exp1;

        let t1Won: boolean;
        const gs = scoredGames[gIndex];
        if (gs && typeof gs.teamOneScore === 'number' && typeof gs.teamTwoScore === 'number') {
          t1Won = gs.teamOneScore > gs.teamTwoScore;
        } else {
          t1Won = gIndex < t1Wins;
        }

        const act1 = t1Won ? 1 : 0;
        const act2 = t1Won ? 0 : 1;
        const mm = calculateMarginMultiplier(gs?.teamOneScore, gs?.teamTwoScore);

        for (const pid of teamOnePlayerIds) {
          const s = ratingsMap.get(pid)!;
          const k = getKFactor(s.careerGames);
          s.elo += k * (act1 - exp1) * mm;
          s.careerGames += 1;
          s.isProvisional = s.careerGames < PROVISIONAL_THRESHOLD;
        }
        for (const pid of teamTwoPlayerIds) {
          const s = ratingsMap.get(pid)!;
          const k = getKFactor(s.careerGames);
          s.elo += k * (act2 - exp2) * mm;
          s.careerGames += 1;
          s.isProvisional = s.careerGames < PROVISIONAL_THRESHOLD;
        }
      }
    }

    const point: { date: string; [playerName: string]: number | string } = { date: dateStr };
    for (const [pid, pstate] of ratingsMap.entries()) {
      const name = playerNames.get(pid);
      if (name) {
        point[name] = Math.round(pstate.elo);
      }
    }
    trajectory.push(point);
  }

  return trajectory;
}

