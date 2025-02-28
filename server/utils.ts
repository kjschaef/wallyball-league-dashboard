
/**
 * Formats a team identifier from an array of player IDs.
 * Sorts and removes null values, then joins with hyphens.
 */
export function formatTeam(players: (number | null)[]): string {
  return players
    .filter(id => id !== null)
    .sort((a, b) => (a || 0) - (b || 0))
    .join('-');
}
