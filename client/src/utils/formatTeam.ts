/**
 * Formats a team name from player names, ensuring consistent team identification
 * regardless of player order.
 * 
 * @param players - Array of player names
 * @returns Formatted team name string
 */
export function formatTeam(players: (string | number | null)[]): string {
  if (!players || players.length === 0) return "No players";

  // Check if array contains any numbers - if so, handle as numeric IDs
  const hasNumericPlayers = players.some(p => typeof p === 'number');
  
  if (hasNumericPlayers) {
    // For numeric IDs, filter out nulls, sort and join with hyphens
    const validPlayers = players
      .filter((p): p is number => p !== null && typeof p === 'number')
      .sort((a, b) => a - b)
      .map(p => p.toString());
      
    if (validPlayers.length === 0) return "No players";
    return validPlayers.join('-');
  }
  
  // For string players, follow the naming convention with "and"
  const validPlayers = players
    .filter(p => p !== null)
    .map(p => p?.toString() || '');
    
  if (validPlayers.length === 0) return "No players";
  
  // Sort all inputs for consistency
  const sortedPlayers = [...validPlayers].sort();
  
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
  if (!playerIds || playerIds.length === 0) return "No players";
  
  const playerNames = playerIds
    .filter((id): id is number => id !== null)
    // Sort IDs to ensure consistent team identification regardless of player order
    .sort()
    .map(id => players.find(p => p.id === id)?.name)
    .filter((name): name is string => name !== undefined);
    
  if (playerNames.length === 0) return "No players";
  if (playerNames.length === 1) return playerNames[0];
  if (playerNames.length === 2) return `${playerNames[0]} and ${playerNames[1]}`;
  
  return `${playerNames[0]}, ${playerNames[1]} and ${playerNames[2]}`;
}