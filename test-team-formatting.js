// Simple script to test the team formatting function

// Original buggy implementation for comparison
function formatTeamOriginal(players) {
  if (players.length === 0) return "No players";
  
  // Notice the lack of sorting here, which is the bug
  if (players.length === 1) return players[0];
  if (players.length === 2) return `${players[0]} and ${players[1]}`;
  return `${players[0]}, ${players[1]} and ${players[2]}`;
}

// Fixed implementation
function formatTeamFixed(players) {
  if (players.length === 0) return "No players";
  
  // Sort players to ensure consistent team identification regardless of order
  const sortedPlayers = [...players].sort();
  
  if (sortedPlayers.length === 1) return sortedPlayers[0];
  if (sortedPlayers.length === 2) return `${sortedPlayers[0]} and ${sortedPlayers[1]}`;
  return `${sortedPlayers[0]}, ${sortedPlayers[1]} and ${sortedPlayers[2]}`;
}

// Test cases
const testCases = [
  {
    name: "Empty team",
    players: [],
    expected: "No players"
  },
  {
    name: "Single player team",
    players: ["Alice"],
    expected: "Alice"
  },
  {
    name: "Two player team - order 1",
    players: ["Alice", "Bob"],
    expected: "Alice and Bob"
  },
  {
    name: "Two player team - order 2",
    players: ["Bob", "Alice"],
    expected: "Alice and Bob"
  },
  {
    name: "Three player team - order 1",
    players: ["Alice", "Bob", "Charlie"],
    expected: "Alice, Bob and Charlie"
  },
  {
    name: "Three player team - order 2",
    players: ["Charlie", "Alice", "Bob"],
    expected: "Alice, Bob and Charlie"
  }
];

// Run tests
console.log("Testing formatTeam functions:");
console.log("----------------------------");

// Original implementation
console.log("\nOriginal (buggy) implementation:");
testCases.forEach(testCase => {
  const result = formatTeamOriginal(testCase.players);
  const passed = result === testCase.expected;
  
  console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
  if (!passed) {
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got:      "${result}"`);
  }
});

// Fixed implementation
console.log("\nFixed implementation:");
testCases.forEach(testCase => {
  const result = formatTeamFixed(testCase.players);
  const passed = result === testCase.expected;
  
  console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
  if (!passed) {
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got:      "${result}"`);
  }
});

// Verify the key bug fix: different order should produce same team name
const team1 = ["Alice", "Bob"];
const team2 = ["Bob", "Alice"];

console.log("\nVerifying key bug fix:");
console.log(`Original implementation - same team with different order: ${formatTeamOriginal(team1) === formatTeamOriginal(team2) ? '✅ Same team name' : '❌ Different team names'}`);
console.log(`Fixed implementation - same team with different order: ${formatTeamFixed(team1) === formatTeamFixed(team2) ? '✅ Same team name' : '❌ Different team names'}`);