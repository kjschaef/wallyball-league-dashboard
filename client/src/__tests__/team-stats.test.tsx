import { describe, it, expect } from 'vitest';

// This mimics the formatTeam function in Results.tsx
const formatTeam = (players: string[]) => {
  if (players.length === 0) return "No players";
  if (players.length === 1) return players[0];
  if (players.length === 2) return `${players[0]} and ${players[1]}`;
  return `${players[0]}, ${players[1]} and ${players[2]}`;
};

// This is a fixed version that sorts player names
const formatTeamSorted = (players: string[]) => {
  if (players.length === 0) return "No players";
  const sortedPlayers = [...players].sort();
  if (sortedPlayers.length === 1) return sortedPlayers[0];
  if (sortedPlayers.length === 2) return `${sortedPlayers[0]} and ${sortedPlayers[1]}`;
  return `${sortedPlayers[0]}, ${sortedPlayers[1]} and ${sortedPlayers[2]}`;
};

describe('Team Stats Functionality', () => {
  it('demonstrates the bug - same team with different player order treated as different teams', () => {
    const matches = [
      {
        id: 1,
        date: "2023-01-01",
        teamOnePlayers: ["Chris", "Keith"],
        teamTwoPlayers: ["John", "Mike"],
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1
      },
      {
        id: 2,
        date: "2023-01-02",
        teamOnePlayers: ["Keith", "Chris"], // Same team but players in different order
        teamTwoPlayers: ["John", "Mike"],
        teamOneGamesWon: 3,
        teamTwoGamesWon: 0
      }
    ];

    // Process matches as done in Results.tsx
    const stats = matches.reduce(
      (acc, match) => {
        const teamOne = formatTeam(match.teamOnePlayers);
        const teamTwo = formatTeam(match.teamTwoPlayers);

        // Update team one stats
        if (!acc[teamOne]) {
          acc[teamOne] = { wins: 0, losses: 0, gamesPlayed: 0 };
        }
        acc[teamOne].wins += match.teamOneGamesWon;
        acc[teamOne].losses += match.teamTwoGamesWon;
        acc[teamOne].gamesPlayed += match.teamOneGamesWon + match.teamTwoGamesWon;

        // Update team two stats
        if (!acc[teamTwo]) {
          acc[teamTwo] = { wins: 0, losses: 0, gamesPlayed: 0 };
        }
        acc[teamTwo].wins += match.teamTwoGamesWon;
        acc[teamTwo].losses += match.teamOneGamesWon;
        acc[teamTwo].gamesPlayed += match.teamOneGamesWon + match.teamTwoGamesWon;

        return acc;
      },
      {} as Record<string, { wins: number; losses: number; gamesPlayed: number }>
    );

    // We expect to see both versions of the team as separate entries
    expect(stats["Chris and Keith"]).toBeDefined();
    expect(stats["Keith and Chris"]).toBeDefined();
    expect(Object.keys(stats).length).toBe(3); // Two versions of team 1 + one team 2

    // Each version has its own independent stats
    expect(stats["Chris and Keith"].wins).toBe(2);
    expect(stats["Keith and Chris"].wins).toBe(3);

    // They should be combined for accurate team statistics
    expect(stats["Chris and Keith"].wins + stats["Keith and Chris"].wins).toBe(5);
  });

  it('demonstrates the fixed implementation - teams treated the same regardless of player order', () => {
    const matches = [
      {
        id: 1,
        date: "2023-01-01",
        teamOnePlayers: ["Chris", "Keith"],
        teamTwoPlayers: ["John", "Mike"],
        teamOneGamesWon: 2,
        teamTwoGamesWon: 1
      },
      {
        id: 2,
        date: "2023-01-02",
        teamOnePlayers: ["Keith", "Chris"], // Same team but players in different order
        teamTwoPlayers: ["Mike", "John"],  // Same team but players in different order
        teamOneGamesWon: 3,
        teamTwoGamesWon: 0
      }
    ];

    // Process matches with the sorted formatTeam function
    const stats = matches.reduce(
      (acc, match) => {
        const teamOne = formatTeamSorted(match.teamOnePlayers);
        const teamTwo = formatTeamSorted(match.teamTwoPlayers);

        // Update team one stats
        if (!acc[teamOne]) {
          acc[teamOne] = { wins: 0, losses: 0, gamesPlayed: 0 };
        }
        acc[teamOne].wins += match.teamOneGamesWon;
        acc[teamOne].losses += match.teamTwoGamesWon;
        acc[teamOne].gamesPlayed += match.teamOneGamesWon + match.teamTwoGamesWon;

        // Update team two stats
        if (!acc[teamTwo]) {
          acc[teamTwo] = { wins: 0, losses: 0, gamesPlayed: 0 };
        }
        acc[teamTwo].wins += match.teamTwoGamesWon;
        acc[teamTwo].losses += match.teamOneGamesWon;
        acc[teamTwo].gamesPlayed += match.teamOneGamesWon + match.teamTwoGamesWon;

        return acc;
      },
      {} as Record<string, { wins: number; losses: number; gamesPlayed: number }>
    );

    // Now there should only be one entry for the team regardless of order
    const firstTeamKey = formatTeamSorted(["Chris", "Keith"]);
    const secondTeamKey = formatTeamSorted(["John", "Mike"]);
    
    expect(Object.keys(stats).length).toBe(2); // Just two teams total
    
    // The combined team stats are correct
    expect(stats[firstTeamKey].wins).toBe(5);
    expect(stats[firstTeamKey].losses).toBe(1);
    expect(stats[firstTeamKey].gamesPlayed).toBe(6);
  });
});