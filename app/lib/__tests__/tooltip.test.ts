import { formatTooltip } from '../tooltip';

describe('formatTooltip', () => {
  it('returns percentage for winPercentage metric', () => {
    const result = formatTooltip(62.4, 'Alice', { payload: { date: '2025-03-01' } }, 'winPercentage', [], [], []);
    expect(result[0]).toBe('62.4%');
    expect(result[1]).toBe('Alice');
  });

  it('returns numeric value for non-winPercentage metrics', () => {
    const res = formatTooltip(5, 'X', { payload: { date: '2025-03-01' } }, 'totalWins', [], [], []);
    expect(res[0]).toBe(5);
  });
});
