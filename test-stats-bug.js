// This mimics the formatTeam function in Results.tsx
const formatTeam = (players) => {
  if (players.length === 0) return "No players";
  if (players.length === 1) return players[0];
  if (players.length === 2) return `${players[0]} and ${players[1]}`;
  return `${players[0]}, ${players[1]} and ${players[2]}`;
};

// This is a fixed version that sorts player names
const formatTeamSorted = (players) => {
  if (players.length === 0) return "No players";
  const sortedPlayers = [...players].sort();
  if (sortedPlayers.length === 1) return sortedPlayers[0];
  if (sortedPlayers.length === 2) return `${sortedPlayers[0]} and ${sortedPlayers[1]}`;
  return `${sortedPlayers[0]}, ${sortedPlayers[1]} and ${sortedPlayers[2]}`;
};

// Test data
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

// Current implementation (with the bug)
function testCurrentImplementation() {
  console.log("TESTING CURRENT IMPLEMENTATION (with bug):");
  
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
    {}
  );

  console.log("Generated teams:", Object.keys(stats));
  console.log("Total number of teams:", Object.keys(stats).length);
  console.log("'Chris and Keith' stats:", stats["Chris and Keith"]);
  console.log("'Keith and Chris' stats:", stats["Keith and Chris"]);
  console.log("'John and Mike' stats:", stats["John and Mike"]);
  
  // Assert that we have separate entries for the same team with different player orders
  console.log("\nBUG VERIFICATION:");
  console.log("Are 'Chris and Keith' and 'Keith and Chris' treated as different teams?", 
    stats["Chris and Keith"] !== undefined && stats["Keith and Chris"] !== undefined);
  
  // The issue is that these should be considered the same team, but they're tracked separately
  const totalWins = (stats["Chris and Keith"]?.wins || 0) + (stats["Keith and Chris"]?.wins || 0);
  console.log("Combined wins that should be together:", totalWins);
}

// Fixed implementation (sorting player names)
function testFixedImplementation() {
  console.log("\n\nTESTING FIXED IMPLEMENTATION:");
  
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
    {}
  );

  console.log("Generated teams:", Object.keys(stats));
  console.log("Total number of teams:", Object.keys(stats).length);
  
  // Get the consistent key for the first team
  const firstTeamKey = formatTeamSorted(["Chris", "Keith"]);
  console.log(`Stats for '${firstTeamKey}':`, stats[firstTeamKey]);
  
  // Assert that we now have the correct combined stats
  console.log("\nFIX VERIFICATION:");
  console.log("Number of unique teams correctly identified:", Object.keys(stats).length === 2);
  console.log("Combined team has correct win count:", stats[firstTeamKey].wins === 5);
}

// Run the tests
testCurrentImplementation();
testFixedImplementation();