/**
 * Utility functions for calculating inactivity penalties
 */

export interface Match {
  date: string;
}

export interface Season {
  id: number;
  start_date: string;
  end_date: string;
  name: string;
}

/**
 * Calculates the inactivity penalty for a player based on their match history
 * 
 * @param matches Array of matches the player has participated in
 * @param createdAt Player's account creation date
 * @param playerName Optional player name for debugging
 * @returns Penalty percentage (0-50)
 */
export function calculateInactivityPenalty(
  matches: Array<Match>, 
  createdAt: string | null, 
  _playerName?: string
): number {
  // Only bail out when we have no matches AND no createdAt to base a calculation on.
  if (matches.length === 0 && !createdAt) return 0;
  
  const now = new Date();
  const lastMatchDate = matches.length > 0 
    ? new Date(Math.max(...matches.map(m => new Date(m.date).getTime())))
    : new Date(createdAt);
  
  const daysSinceLastMatch = Math.floor((now.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksSinceLastMatch = Math.floor(daysSinceLastMatch / 7);
  
  // IMMEDIATE PENALTY RESET: If player has played within the last 3 days, reset penalty to 0
  if (daysSinceLastMatch <= 3) {
    return 0;
  }
  
  // No penalty for first 2 weeks
  if (weeksSinceLastMatch <= 2) {
    return 0;
  }
  
  // 5% penalty per week after 2 weeks, capped at 50%
  const penaltyWeeks = weeksSinceLastMatch - 2;
  return Math.min(penaltyWeeks * 5, 50);
}

/**
 * Utility: check if current date falls within any exemption windows. Caller passes list.
 */
export interface InactivityExemptionWindow {
  startDate: string; // ISO date
  endDate?: string | null; // optional ISO date
}

export function isWithinExemption(now: Date, exemptions: InactivityExemptionWindow[] | undefined): boolean {
  if (!exemptions || exemptions.length === 0) return false;
  return exemptions.some(ex => {
    const s = new Date(ex.startDate);
    const e = ex.endDate ? new Date(ex.endDate) : undefined;
    if (e) return now >= s && now <= e;
    return now >= s;
  });
}

/**
 * Calculates inactivity penalty while honoring exemption windows.
 * If currently within any exemption window, returns 0.
 * Otherwise, the inactivity "clock" resumes from the later of the last match date or the latest
 * exemption end date prior to now.
 */
export function calculateInactivityPenaltyWithExemptions(
  matches: Array<Match>,
  createdAt: string | null,
  exemptions?: InactivityExemptionWindow[]
): number {
  // Only bail out when we have neither matches nor a createdAt date to base inactivity from.
  if (matches.length === 0 && !createdAt) return 0;

  const now = new Date();

  // If currently within an exemption, no penalty applies
  if (isWithinExemption(now, exemptions)) return 0;

  // Determine baseline last activity date (last match or createdAt)
  const lastMatchDate = matches.length > 0 
    ? new Date(Math.max(...matches.map(m => new Date(m.date).getTime())))
    : (createdAt ? new Date(createdAt) : new Date());

  // If there are exemptions that ended after the last match date, "pause" inactivity until that end
  let effectiveLastActivity = lastMatchDate;
  if (exemptions && exemptions.length > 0) {
    const latestEnd = exemptions
      .map(ex => ex.endDate ? new Date(ex.endDate) : null)
      .filter((d): d is Date => !!d)
      .filter(d => d <= now) // only past end dates
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (latestEnd && latestEnd > effectiveLastActivity) {
      effectiveLastActivity = latestEnd;
    }
  }

  const daysSince = Math.floor((now.getTime() - effectiveLastActivity.getTime()) / (1000 * 60 * 60 * 24));

  // Immediate reset if played very recently
  if (daysSince <= 3) return 0;

  const weeks = Math.floor(daysSince / 7);
  if (weeks <= 2) return 0;
  const penaltyWeeks = weeks - 2;
  return Math.min(penaltyWeeks * 5, 50);
}

/**
 * Filters matches to exclude those with timestamps more than 24 hours in the future
 * This prevents timezone issues and future-dated matches from affecting calculations
 * 
 * @param matches Array of matches to filter
 * @returns Filtered matches array
 */
export function filterFutureMatches(matches: Array<Match>): Array<Match> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  return matches.filter(match => new Date(match.date) <= tomorrow);
}

/**
 * Helper function for components that need decay factor format
 * Provides the same interface as the old utils function but uses the centralized logic
 * 
 * @param matches Array of matches the player has participated in
 * @param createdAt Player's account creation date
 * @returns Object with penalty details in component-friendly format
 */
export function calculateInactivityPenaltyWithDecay(
  matches: Array<Match>, 
  createdAt: string | null
) {
  const penaltyPercentage = calculateInactivityPenalty(matches, createdAt);
  const penaltyDecimal = penaltyPercentage / 100; // Convert percentage to decimal
  
  const now = new Date();
  const lastMatchDate = matches.length > 0 
    ? new Date(Math.max(...matches.map(m => new Date(m.date).getTime())))
    : (createdAt ? new Date(createdAt) : new Date());
  
  const daysSinceLastMatch = Math.floor((now.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksInactive = Math.floor(daysSinceLastMatch / 7);
  
  return {
    lastMatch: lastMatchDate,
    weeksInactive: Math.max(0, weeksInactive - 2), // Only count weeks beyond grace period
    penaltyPercentage: penaltyDecimal,
    decayFactor: 1 - penaltyDecimal
  };
}

/**
 * Calculates season-specific inactivity penalty for historical seasons
 * 
 * For historical seasons, penalty is calculated based on inactivity within that season only.
 * Players who were active at the end of the season retain their final statistics.
 * 
 * @param matches Array of matches the player participated in during the season
 * @param season Season object with start/end dates
 * @param createdAt Player's account creation date
 * @param playerName Optional player name for debugging
 * @returns Penalty percentage (0-50)
 */
export function calculateSeasonalInactivityPenalty(
  matches: Array<Match>,
  season: Season,
  createdAt: string | null,
  playerName?: string,
  exemptions?: InactivityExemptionWindow[]
): number {
  // Allow calculation when matches exist; only return early if we have neither matches nor createdAt.
  if (matches.length === 0 && !createdAt) return 0;

  const seasonStart = new Date(season.start_date);
  const seasonEnd = new Date(season.end_date);
  
  // Filter matches to only those within the season
  const seasonMatches = filterFutureMatches(matches).filter(match => {
    const matchDate = new Date(match.date);
    return matchDate >= seasonStart && matchDate <= seasonEnd;
  });

  if (seasonMatches.length === 0) return 0;

  // Sort matches chronologically (critical for accurate calculations)
  const sortedMatches = seasonMatches.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const lastMatchInSeason = new Date(sortedMatches[sortedMatches.length - 1].date);
  
  // Determine effective last activity: last match in season or createdAt
  let effectiveLastActivity = lastMatchInSeason;
  if (!effectiveLastActivity && createdAt) effectiveLastActivity = new Date(createdAt);

  // If an exemption covers the season end, no penalty applies
  if (exemptions && isWithinExemption(seasonEnd, exemptions)) return 0;

  // If there are exemptions that ended after the last match date (but before season end),
  // pause inactivity until that end date.
  if (exemptions && exemptions.length > 0) {
    const latestEnd = exemptions
      .map(ex => ex.endDate ? new Date(ex.endDate) : null)
      .filter((d): d is Date => !!d)
      .filter(d => d <= seasonEnd) // only consider ends up to season end
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (latestEnd && latestEnd > effectiveLastActivity) {
      effectiveLastActivity = latestEnd;
    }
  }

  // Calculate inactivity from effective last activity to season end
  const daysBetweenLastMatchAndSeasonEnd = Math.floor(
    (seasonEnd.getTime() - effectiveLastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const weeksSinceLastMatch = Math.floor(daysBetweenLastMatchAndSeasonEnd / 7);
  
  // Apply same rules: 3-day immediate reset (but relative to season end)
  if (daysBetweenLastMatchAndSeasonEnd <= 3) {
    return 0;
  }
  
  // No penalty for first 2 weeks of inactivity
  if (weeksSinceLastMatch <= 2) {
    return 0;
  }
  
  // 5% penalty per week after 2 weeks, capped at 50%
  const penaltyWeeks = weeksSinceLastMatch - 2;
  const penalty = Math.min(penaltyWeeks * 5, 50);
  
  // Debug logging for troubleshooting (similar to existing Trevor debug)
  if (playerName && penalty > 0) {
    console.log(`Seasonal penalty for ${playerName} in ${season.name}: ${penalty}% (inactive ${weeksSinceLastMatch} weeks from ${lastMatchInSeason.toISOString().split('T')[0]} to season end)`);
  }
  
  return penalty;
}

/**
 * Generates a penalty series for a season: weekly penalty values from the last
 * match in season to the season end (inclusive). Returns a map of YYYY-MM-DD -> penaltyPercent
 *
 * This is used by the trends API to show progressive penalty decay across a season
 * for historical seasons.
 */
export function calculateSeasonalPenaltySeries(
  matches: Array<Match>,
  season: Season,
  createdAt: string | null,
  exemptions?: InactivityExemptionWindow[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (matches.length === 0 || !createdAt) return result;

  const seasonStart = new Date(season.start_date);
  const seasonEnd = new Date(season.end_date);

  // Filter and sort matches within the season
  const seasonMatches = filterFutureMatches(matches).filter(m => {
    const d = new Date(m.date);
    return d >= seasonStart && d <= seasonEnd;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (seasonMatches.length === 0) return result;

  const lastMatch = new Date(seasonMatches[seasonMatches.length - 1].date);

  // Calculate weeks between last match and season end
  const daysBetween = Math.floor((seasonEnd.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(daysBetween / 7);

  // Start applying penalties after the 2-week grace period. We'll emit weekly points
  // for week indexes 3..(2+totalWeeks)
  // Determine effective last activity (consider exemptions that pause inactivity)
  let effectiveLastActivity = lastMatch;
  if (exemptions && exemptions.length > 0) {
    const latestEnd = exemptions
      .map(ex => ex.endDate ? new Date(ex.endDate) : null)
      .filter((d): d is Date => !!d)
      .filter(d => d <= seasonEnd)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (latestEnd && latestEnd > effectiveLastActivity) {
      effectiveLastActivity = latestEnd;
    }
  }

  for (let week = 3; week <= 2 + totalWeeks; week++) {
    const penaltyWeeks = week - 2;
    const penalty = Math.min(penaltyWeeks * 5, 50);

    const pointDate = new Date(effectiveLastActivity);
    pointDate.setDate(pointDate.getDate() + week * 7);

    // If pointDate is after season end, clamp to season end
    if (pointDate > seasonEnd) {
      pointDate.setTime(seasonEnd.getTime());
    }

    const key = pointDate.toISOString().split('T')[0];
    // Keep the highest penalty for the same date if multiple weeks collapse to season end
    result[key] = Math.max(result[key] || 0, penalty);
  }

  // Ensure season end is present (even if within grace period, penalty could be 0)
  const seasonEndKey = seasonEnd.toISOString().split('T')[0];
  if (!(seasonEndKey in result)) {
    // Compute penalty relative to last match -> season end
    const daysToEnd = Math.floor((seasonEnd.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToEnd > 3) {
      const weeksSince = Math.floor(daysToEnd / 7);
      if (weeksSince > 2) {
        const penalty = Math.min((weeksSince - 2) * 5, 50);
        result[seasonEndKey] = penalty;
      } else {
        result[seasonEndKey] = 0;
      }
    } else {
      result[seasonEndKey] = 0;
    }
  }

  return result;
}
