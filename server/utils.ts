
export function formatTeam(playerIds: number[]): string {
  return playerIds.sort().join('-');
}
