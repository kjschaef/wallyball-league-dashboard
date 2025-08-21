import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { calculateInactivityPenaltyWithDecay } from "../../lib/inactivity-penalty"

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
 * Calculate the win percentage with inactivity penalty applied
 * 
 * @param player Player object with matches, stats and createdAt
 * @returns Object with win percentage details
 */
export function calculatePenalizedWinPercentage(player: PlayerWithMatches & { 
  stats: { won: number, lost: number } 
}) {
  // Calculate base win percentage
  const total = player.stats.won + player.stats.lost;
  const baseWinRate = total > 0 ? (player.stats.won / total) * 100 : 0;
  
  // Apply inactivity penalty using centralized logic
  const matches = player.matches || [];
  const { penaltyPercentage, decayFactor } = calculateInactivityPenaltyWithDecay(
    matches, 
    player.createdAt?.toString() || null
  );
  const penalizedWinRate = baseWinRate * decayFactor;
  
  return {
    baseWinRate,
    penalizedWinRate,
    penaltyPercentage,
    decayFactor
  };
}