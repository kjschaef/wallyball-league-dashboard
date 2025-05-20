import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const now = new Date();
  let lastMatchDate = new Date(0); // Jan 1, 1970
  
  // Find the most recent match date
  if (player.matches && player.matches.length > 0) {
    const dates = player.matches.map(match => new Date(match.date));
    lastMatchDate = new Date(Math.max(...dates.map(date => date.getTime())));
  }
  
  // If no matches, use createdAt date
  if (lastMatchDate.getTime() === 0 && player.createdAt) {
    lastMatchDate = new Date(player.createdAt);
  }
  
  // If neither matches nor createdAt, return no penalty
  if (lastMatchDate.getTime() === 0) {
    return { 
      daysSinceLastMatch: 0,
      penalty: 0,
      hasInactivityPenalty: false
    };
  }
  
  // Calculate days since last match
  const daysSinceLastMatch = Math.floor((now.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // No penalty for first 14 days (2 weeks)
  if (daysSinceLastMatch <= 14) {
    return {
      daysSinceLastMatch,
      penalty: 0,
      hasInactivityPenalty: false
    };
  }
  
  // 5% penalty per week after first 2 weeks, up to 50%
  const weeksInactive = Math.floor((daysSinceLastMatch - 14) / 7);
  const penalty = Math.min(weeksInactive * 5, 50);
  
  return {
    daysSinceLastMatch,
    penalty,
    hasInactivityPenalty: penalty > 0
  };
}

/**
 * Calculate the win percentage with inactivity penalty applied
 * 
 * @param player Player object with matches, stats and createdAt
 * @returns Penalized win percentage
 */
export function calculatePenalizedWinPercentage(player: PlayerWithMatches & { 
  stats?: { won: number, lost: number } 
}) {
  // If no stats, return 0
  if (!player.stats) {
    return 0;
  }
  
  const { won, lost } = player.stats;
  const totalGames = won + lost;
  
  // If no games played, return 0
  if (totalGames === 0) {
    return 0;
  }
  
  // Calculate raw win percentage
  const rawWinPercentage = (won / totalGames) * 100;
  
  // Get inactivity penalty
  const { penalty, hasInactivityPenalty } = calculateInactivityPenalty(player);
  
  if (!hasInactivityPenalty) {
    return rawWinPercentage;
  }
  
  // Apply penalty - this reduces the win percentage by the penalty percentage
  const penalizedWinPercentage = rawWinPercentage * (1 - (penalty / 100));
  
  return penalizedWinPercentage;
}