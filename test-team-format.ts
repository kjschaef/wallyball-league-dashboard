import { formatTeamFromNames, formatTeamUnsorted } from './client/src/lib/formatTeam';

// Test data
const testData = [
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

// Test the broken behavior
function testBrokenImplementation() {
  console.log('\nTEST: Original implementation (with bug)');
  const stats = testData.reduce(
    (acc, match) => {
      const teamOne = formatTeamUnsorted(match.teamOnePlayers);
      const teamTwo = formatTeamUnsorted(match.teamTwoPlayers);

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

  // Log the results
  console.log('Team keys:', Object.keys(stats));
  console.log('Team count:', Object.keys(stats).length);
  console.log(`"Chris and Keith" stats:`, stats["Chris and Keith"]);
  console.log(`"Keith and Chris" stats:`, stats["Keith and Chris"]);
  console.log(`"John and Mike" stats:`, stats["John and Mike"]);
  
  // Verification
  console.log('\nBUG VERIFICATION:');
  const hasBug = stats["Chris and Keith"] && stats["Keith and Chris"];
  console.log(`Are "Chris and Keith" and "Keith and Chris" treated as different teams? ${hasBug ? 'Yes (BUG)' : 'No'}`);
  if (hasBug) {
    console.log(`Combined wins that should be together: ${stats["Chris and Keith"].wins + stats["Keith and Chris"].wins}`);
  }
}

// Test the fixed behavior
function testFixedImplementation() {
  console.log('\nTEST: Fixed implementation (with sorted players)');
  const stats = testData.reduce(
    (acc, match) => {
      const teamOne = formatTeamFromNames(match.teamOnePlayers);
      const teamTwo = formatTeamFromNames(match.teamTwoPlayers);

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

  // Log the results
  console.log('Team keys:', Object.keys(stats));
  console.log('Team count:', Object.keys(stats).length);
  
  // Get the key for the first team
  const firstTeamKey = formatTeamFromNames(["Chris", "Keith"]);
  console.log(`Stats for '${firstTeamKey}':`, stats[firstTeamKey]);
  
  // Verification
  console.log('\nFIX VERIFICATION:');
  const teamCount = Object.keys(stats).length;
  console.log(`Unique teams correctly identified: ${teamCount === 2 ? 'Yes' : 'No'}`);
  console.log(`First team has correct combined win count (5): ${stats[firstTeamKey].wins === 5 ? 'Yes' : 'No'}`);
}

// Run the tests
console.log('=== TEAM FORMATTING BUG TEST ===');
testBrokenImplementation();
testFixedImplementation();