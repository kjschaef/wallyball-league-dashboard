/**
 * Utility functions for calculating inactivity penalties
 */

export interface Match {
  date: string;
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
  if (matches.length === 0 || !createdAt) return 0;
  
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