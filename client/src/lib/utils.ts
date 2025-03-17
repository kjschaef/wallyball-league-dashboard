import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Interface for the player object needed for inactivity calculation
 */
export interface PlayerWithMatches {
  matches?: Array<{ date: string }>;
  createdAt?: string | Date | null;
}

/**
 * Calculate player inactivity penalty
 * No penalty for first 2 weeks, then 5% per week after that up to 50%
 * 
 * @param player Player object with matches and createdAt
 * @returns Object with inactivity details
 */
export function calculateInactivityPenalty(player: PlayerWithMatches) {
  const today = new Date();
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds
  const maxPenalty = 0.5; // 50% maximum penalty
  const penaltyPerWeek = 0.05; // 5% penalty per week after grace period
  
  // Get the last match date or creation date if no matches
  const lastMatch = player.matches && player.matches.length > 0 
    ? new Date(player.matches[player.matches.length - 1].date) 
    : (player.createdAt ? new Date(player.createdAt) : new Date());
  
  // Calculate inactivity time in milliseconds
  const inactiveTime = today.getTime() - lastMatch.getTime();
  
  // Calculate excess inactive time (after 2-week grace period)
  const excessInactiveTime = Math.max(0, inactiveTime - twoWeeksInMs);
  
  // Calculate weeks inactive beyond grace period
  const weeksInactive = Math.floor(excessInactiveTime / (7 * 24 * 60 * 60 * 1000));
  
  // Calculate penalty (5% per week after grace period, up to 50%)
  const penaltyPercentage = Math.min(maxPenalty, weeksInactive * penaltyPerWeek);
  
  return {
    lastMatch,
    weeksInactive,
    penaltyPercentage,
    decayFactor: 1 - penaltyPercentage
  };
}

/**
 * Calculate the win percentage with inactivity penalty applied
 * 
 * @param player Player object with matches, stats and createdAt
 * @returns Penalized win percentage
 */
export function calculatePenalizedWinPercentage(player: PlayerWithMatches & { 
  stats: { won: number, lost: number } 
}) {
  // Calculate base win percentage
  const total = player.stats.won + player.stats.lost;
  const baseWinRate = total > 0 ? (player.stats.won / total) * 100 : 0;
  
  // Apply inactivity penalty
  const { penaltyPercentage, decayFactor } = calculateInactivityPenalty(player);
  const penalizedWinRate = baseWinRate * decayFactor;
  
  return {
    baseWinRate,
    penalizedWinRate,
    penaltyPercentage,
    decayFactor
  };
}
