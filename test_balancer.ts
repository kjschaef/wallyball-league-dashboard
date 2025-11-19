import { generateBalancedTeams } from './app/lib/team-balancer';
import { PlayerStats } from './app/lib/types';

const mockPlayers: PlayerStats[] = [
    { id: 1, name: 'P1', winPercentage: 80, record: { wins: 8, losses: 2, totalGames: 10 }, streak: { type: 'wins', count: 1 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 2, name: 'P2', winPercentage: 60, record: { wins: 6, losses: 4, totalGames: 10 }, streak: { type: 'wins', count: 1 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 3, name: 'P3', winPercentage: 40, record: { wins: 4, losses: 6, totalGames: 10 }, streak: { type: 'losses', count: 1 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 4, name: 'P4', winPercentage: 20, record: { wins: 2, losses: 8, totalGames: 10 }, streak: { type: 'losses', count: 1 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 5, name: 'P5', winPercentage: 70, record: { wins: 7, losses: 3, totalGames: 10 }, streak: { type: 'wins', count: 1 }, yearsPlayed: 1, totalPlayingTime: 100 },
    { id: 6, name: 'P6', winPercentage: 30, record: { wins: 3, losses: 7, totalGames: 10 }, streak: { type: 'losses', count: 1 }, yearsPlayed: 1, totalPlayingTime: 100 },
];

console.log('Testing with 4 players...');
const result4 = generateBalancedTeams(mockPlayers.slice(0, 4));
console.log('Result 4 count:', result4.length);
result4.forEach((r, i) => {
    const t1 = r.teamOne.map(p => p.name).sort().join(',');
    const t2 = r.teamTwo.map(p => p.name).sort().join(',');
    console.log(`Scenario ${i}: [${t1}] vs [${t2}] - Balance ${r.balanceScore}`);
});

console.log('\nTesting with 5 players...');
const result5 = generateBalancedTeams(mockPlayers.slice(0, 5));
console.log('Result 5 count:', result5.length);
result5.forEach((r, i) => {
    const t1 = r.teamOne.map(p => p.name).sort().join(',');
    const t2 = r.teamTwo.map(p => p.name).sort().join(',');
    console.log(`Scenario ${i}: [${t1}] vs [${t2}] - Balance ${r.balanceScore}`);
});

console.log('\nTesting with 6 players...');
const result6 = generateBalancedTeams(mockPlayers);
console.log('Result 6 count:', result6.length);
result6.forEach((r, i) => {
    const t1 = r.teamOne.map(p => p.name).sort().join(',');
    const t2 = r.teamTwo.map(p => p.name).sort().join(',');
    console.log(`Scenario ${i}: [${t1}] vs [${t2}] - Balance ${r.balanceScore}`);
});
