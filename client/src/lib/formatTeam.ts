/**
 * Formats a team name from an array of player names
 * Always sorts players first to ensure consistent team identification 
 * regardless of the order players are added
 * 
 * @param players - Array of player names
 * @returns Formatted team name string
 */
export function formatTeamFromNames(players: string[]): string {
  if (players.length === 0) return "No players";
  
  // Sort players to ensure consistent team identification regardless of order
  const sortedPlayers = [...players].sort();
  
  if (sortedPlayers.length === 1) return sortedPlayers[0];
  if (sortedPlayers.length === 2) return `${sortedPlayers[0]} and ${sortedPlayers[1]}`;
  return `${sortedPlayers[0]}, ${sortedPlayers[1]} and ${sortedPlayers[2]}`;
}

/**
 * Formats a team name from player IDs by looking up names from a list of players
 * Always sorts IDs first to ensure consistent team identification
 * 
 * @param playerIds - Array of player IDs (can include null values which will be filtered out)
 * @param getPlayerName - Function to get player name from ID
 * @returns Formatted team name string
 */
export function formatTeamFromIds<T>(
  playerIds: (number | null)[],
  getPlayerName: (id: number) => string | undefined
): string {
  const validPlayerNames = playerIds
    .filter((id): id is number => id !== null)
    // Sort IDs to ensure consistent team identification regardless of player order
    .sort()
    .map(getPlayerName)
    .filter(Boolean) as string[];

  return formatTeamFromNames(validPlayerNames);
}

/**
 * Test helper function that demonstrates the bug in the original implementation
 * This does NOT sort players before formatting the team name
 */
export function formatTeamUnsorted(players: string[]): string {
  if (players.length === 0) return "No players";
  if (players.length === 1) return players[0];
  if (players.length === 2) return `${players[0]} and ${players[1]}`;
  return `${players[0]}, ${players[1]} and ${players[2]}`;
}