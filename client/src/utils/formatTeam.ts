/**
 * Formats a team name from player names, ensuring consistent team identification
 * regardless of player order.
 * 
 * @param players - Array of player names
 * @returns Formatted team name string
 */
export function formatTeam(players: string[]): string {
  if (players.length === 0) return "No players";
  
  // Sort players to ensure consistent team identification regardless of order
  const sortedPlayers = [...players].sort();
  
  if (sortedPlayers.length === 1) return sortedPlayers[0];
  if (sortedPlayers.length === 2) return `${sortedPlayers[0]} and ${sortedPlayers[1]}`;
  return `${sortedPlayers[0]}, ${sortedPlayers[1]} and ${sortedPlayers[2]}`;
}

/**
 * Formats a team name from player IDs by looking up player names in the provided players array.
 * Ensures consistent team identification regardless of player order.
 * 
 * @param playerIds - Array of player IDs (can include null values)
 * @param players - Array of player objects with id and name properties
 * @returns Formatted team name string
 */
export function formatTeamFromIds(
  playerIds: (number | null)[], 
  players: Array<{id: number, name: string}>
): string {
  return playerIds
    .filter((id): id is number => id !== null)
    // Sort IDs to ensure consistent team identification regardless of player order
    .sort()
    .map(id => players.find(p => p.id === id)?.name)
    .filter((name): name is string => name !== undefined)
    .join(", ");
}