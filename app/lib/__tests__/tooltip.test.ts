import { formatTooltip } from '../tooltip';

describe('formatTooltip', () => {
  it('includes penalty info when inactivityPenalty is present', () => {
    const trendsData = [
      {
        name: 'Alice',
        dailyStats: {
          '2025-03-01': { winPercentage: 60, rawWinPercentage: 70, inactivityPenalty: 10 }
        }
      }
    ];

    const playerStats = [{ name: 'Alice', inactivityPenalty: 10 }];
    const dateRange = ['2025-03-01'];

    const result = formatTooltip(62.4, 'Alice', { payload: { date: '2025-03-01' } }, 'winPercentage', trendsData as any, playerStats as any, dateRange);
    expect(result[0]).toContain('-10%');
    expect(result[0]).toContain('%');
  });

  it('returns numeric value for non-winPercentage metrics', () => {
    const res = formatTooltip(5, 'X', { payload: { date: '2025-03-01' } }, 'totalWins', [], [], []);
    expect(res[0]).toBe(5);
  });
});

