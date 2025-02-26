
/**
 * Formats a team name from player IDs, ensuring consistent team identification
 * regardless of player order.
 * 
 * @param playerIds - Array of player IDs (can include null values)
 * @returns Formatted team name string with sorted player IDs
 */
export function formatTeam(playerIds: (number | null)[]): string {
  const validIds = playerIds.filter((id): id is number => id !== null);
  
  // Sort IDs to ensure consistent team identification regardless of input order
  validIds.sort((a, b) => a - b);
  
  return validIds.join('-');
}
