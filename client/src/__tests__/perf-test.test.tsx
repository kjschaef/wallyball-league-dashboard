import { formatTeam } from '../utils/formatTeam';

describe('Team Formatting Performance', () => {
  // Small test for baseline performance
  test('formatTeam basic performance test', () => {
    const startTime = performance.now();
    
    // Run the function many times to measure performance
    for (let i = 0; i < 10000; i++) {
      formatTeam(['Alice', 'Bob']);
      formatTeam(['Bob', 'Alice']);
      formatTeam(['Charlie', 'Alice', 'Bob']);
    }
    
    const endTime = performance.now();
    console.log(`Basic performance test took ${endTime - startTime}ms`);
    
    // We don't need an assertion, this is just for timing
    expect(true).toBe(true);
  });
  
  // More complex performance test with realistic data
  test('formatTeam with realistic data performance', () => {
    const startTime = performance.now();
    
    // Create a larger set of test data
    const players = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
    
    // Run a more complex scenario
    for (let i = 0; i < 1000; i++) {
      // Simulate different team combinations
      for (let j = 0; j < players.length; j++) {
        for (let k = j + 1; k < players.length; k++) {
          formatTeam([players[j], players[k]]);
          formatTeam([players[k], players[j]]);
        }
      }
    }
    
    const endTime = performance.now();
    console.log(`Complex performance test took ${endTime - startTime}ms`);
    
    // We don't need an assertion, this is just for timing
    expect(true).toBe(true);
  });
});