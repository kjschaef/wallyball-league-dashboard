
export function formatTeam(playerIds: (number | null)[]): string {
  return playerIds
    .filter((id): id is number => id !== null)
    .sort()
    .join('-');
}
