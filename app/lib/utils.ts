import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateInactivityPenalty(lastMatchDate: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastMatchDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  
  return Math.min(diffWeeks * 0.05, 0.5);
}

export function calculatePenalizedWinPercentage(
  wins: number,
  losses: number,
  lastMatchDate: Date
): number {
  if (wins + losses === 0) return 0;
  
  const rawWinPercentage = wins / (wins + losses);
  const inactivityPenalty = calculateInactivityPenalty(lastMatchDate);
  
  return rawWinPercentage * (1 - inactivityPenalty);
}
