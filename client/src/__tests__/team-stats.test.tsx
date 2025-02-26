// Using Jest testing framework
import '@jest/globals';

/**
 * Test functions for volleyball team stats functionality
 */

// This mimics the original formatTeam function in Results.tsx
const formatTeam = (players: string[]): string => {
  if (players.length === 0) return "No players";
  if (players.length === 1) return players[0];
  if (players.length === 2) return `${players[0]} and ${players[1]}`;
  return `${players[0]}, ${players[1]} and ${players[2]}`;
};

// This is a fixed version that sorts player names first
const formatTeamSorted = (players: string[]): string => {
  if (players.length === 0) return "No players";
  const sortedPlayers = [...players].sort();
  if (sortedPlayers.length === 1) return sortedPlayers[0];
  if (sortedPlayers.length === 2) return `${sortedPlayers[0]} and ${sortedPlayers[1]}`;
  return `${sortedPlayers[0]}, ${sortedPlayers[1]} and ${sortedPlayers[2]}`;
};

// Mock match data for testing
interface Match {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

interface TeamStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
}

describe('Team Stats Processing', () => {
  // Common test data
  const testMatches: Match[] = [
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

  // Test demonstrating the bug with current implementation
  it('should incorrectly treat teams with same players in different order as different teams', () => {
    // Process matches as done currently in Results.tsx
    const stats = processMatchesWithOriginalFunction(testMatches);

    // Verify the teams are treated as different
    expect(stats["Chris and Keith"]).toBeDefined();
    expect(stats["Keith and Chris"]).toBeDefined();
    
    // Should have 3 teams (two versions of team 1 + one team 2)
    expect(Object.keys(stats).length).toBe(3);
    
    // Each version should have its own separate stats
    expect(stats["Chris and Keith"].wins).toBe(2);
    expect(stats["Keith and Chris"].wins).toBe(3);
    
    // Total wins should be combined for a true picture of the team
    expect(stats["Chris and Keith"].wins + stats["Keith and Chris"].wins).toBe(5);
  });

  // Test demonstrating the fixed implementation
  it('should correctly treat teams with same players regardless of order as the same team', () => {
    // Process matches with the fixed implementation
    const stats = processMatchesWithFixedFunction(testMatches);

    // Get the consistent keys regardless of input order
    const firstTeamKey = formatTeamSorted(["Chris", "Keith"]);
    const secondTeamKey = formatTeamSorted(["John", "Mike"]);
    
    // Should only have 2 unique teams
    expect(Object.keys(stats).length).toBe(2);
    
    // Stats should be properly accumulated for the team
    expect(stats[firstTeamKey].wins).toBe(5);
    expect(stats[firstTeamKey].losses).toBe(1);
    expect(stats[firstTeamKey].gamesPlayed).toBe(6);
    
    // Second team's stats should be accurate too
    expect(stats[secondTeamKey].wins).toBe(1);
    expect(stats[secondTeamKey].losses).toBe(5);
  });
  
  // Test to verify consistent team identification for different orders
  it('should generate the same team name regardless of player order', () => {
    const order1 = formatTeamSorted(["Chris", "Keith"]);
    const order2 = formatTeamSorted(["Keith", "Chris"]);
    
    expect(order1).toBe(order2);
  });
  
  // Test different team sizes
  it('should handle teams of different sizes correctly', () => {
    // Empty team
    expect(formatTeamSorted([])).toBe("No players");
    
    // Single player team
    expect(formatTeamSorted(["Chris"])).toBe("Chris");
    
    // Three player team - should sort players
    const threePlayerTeam = formatTeamSorted(["Zach", "Chris", "Keith"]);
    expect(threePlayerTeam).toBe("Chris, Keith and Zach");
  });
});

// Helper function that mimics the current implementation in Results.tsx
function processMatchesWithOriginalFunction(matches: Match[]): Record<string, TeamStats> {
  return matches.reduce(
    (acc, match) => {
      const teamOne = formatTeam(match.teamOnePlayers);
      const teamTwo = formatTeam(match.teamTwoPlayers);

      // Update team one stats
      if (!acc[teamOne]) {
        acc[teamOne] = { wins: 0, losses: 0, gamesPlayed: 0 };
      }
      acc[teamOne].wins += match.teamOneGamesWon;
      acc[teamOne].losses += match.teamTwoGamesWon;
      acc[teamOne].gamesPlayed +=
        match.teamOneGamesWon + match.teamTwoGamesWon;

      // Update team two stats
      if (!acc[teamTwo]) {
        acc[teamTwo] = { wins: 0, losses: 0, gamesPlayed: 0 };
      }
      acc[teamTwo].wins += match.teamTwoGamesWon;
      acc[teamTwo].losses += match.teamOneGamesWon;
      acc[teamTwo].gamesPlayed +=
        match.teamOneGamesWon + match.teamTwoGamesWon;

      return acc;
    },
    {} as Record<string, TeamStats>
  );
}

// Helper function that uses the fixed formatTeam implementation
function processMatchesWithFixedFunction(matches: Match[]): Record<string, TeamStats> {
  return matches.reduce(
    (acc, match) => {
      const teamOne = formatTeamSorted(match.teamOnePlayers);
      const teamTwo = formatTeamSorted(match.teamTwoPlayers);

      // Update team one stats
      if (!acc[teamOne]) {
        acc[teamOne] = { wins: 0, losses: 0, gamesPlayed: 0 };
      }
      acc[teamOne].wins += match.teamOneGamesWon;
      acc[teamOne].losses += match.teamTwoGamesWon;
      acc[teamOne].gamesPlayed +=
        match.teamOneGamesWon + match.teamTwoGamesWon;

      // Update team two stats
      if (!acc[teamTwo]) {
        acc[teamTwo] = { wins: 0, losses: 0, gamesPlayed: 0 };
      }
      acc[teamTwo].wins += match.teamTwoGamesWon;
      acc[teamTwo].losses += match.teamOneGamesWon;
      acc[teamTwo].gamesPlayed +=
        match.teamOneGamesWon + match.teamTwoGamesWon;

      return acc;
    },
    {} as Record<string, TeamStats>
  );
}