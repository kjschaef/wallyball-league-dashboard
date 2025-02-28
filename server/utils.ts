
/**
 * Formats a team identifier from an array of player IDs.
 * Sorts, removes null values and duplicates, then joins with hyphens.
 */
export function formatTeam(players: (number | null)[]): string {
  // Create a new array to avoid modifying the original
  return [...players]
    // Remove null values
    .filter(id => id !== null)
    // Create a unique set to remove duplicates
    .filter((id, index, array) => array.indexOf(id) === index)
    // Sort numerically
    .sort((a, b) => (a || 0) - (b || 0))
    // Join with hyphens
    .join('-');
}
