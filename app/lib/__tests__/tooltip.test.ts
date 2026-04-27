import { formatTooltip } from '../tooltip';

describe('formatTooltip', () => {
  const mockProps = { payload: { date: '2025-03-01' } };
  const mockTrends: any[] = [];
  const mockStats: any[] = [];
  const mockDateRange: string[] = [];

  it('returns percentage string for winPercentage metric', () => {
    const result = formatTooltip(62.4, 'Alice', mockProps, 'winPercentage', mockTrends, mockStats, mockDateRange);
    expect(result).toEqual(['62.4%', 'Alice']);
  });

  it('rounds winPercentage using toFixed(1) logic', () => {
    // 62.45.toFixed(1) is '62.5' in Node
    const result = formatTooltip(62.45, 'Alice', mockProps, 'winPercentage', mockTrends, mockStats, mockDateRange);
    expect(result[0]).toBe('62.5%');

    // 62.44.toFixed(1) is '62.4'
    const result2 = formatTooltip(62.44, 'Bob', mockProps, 'winPercentage', mockTrends, mockStats, mockDateRange);
    expect(result2[0]).toBe('62.4%');
  });

  it('returns numeric value for non-winPercentage metrics', () => {
    const res = formatTooltip(5, 'X', mockProps, 'totalWins', mockTrends, mockStats, mockDateRange);
    expect(res).toEqual([5, 'X']);
  });

  it('rounds non-winPercentage values using toFixed(1) logic', () => {
    // 5.55.toFixed(1) is '5.5' in Node
    const res = formatTooltip(5.55, 'Bob', mockProps, 'avgPoints', mockTrends, mockStats, mockDateRange);
    expect(res[0]).toBe(5.5);

    const res2 = formatTooltip(5.56, 'Charlie', mockProps, 'avgPoints', mockTrends, mockStats, mockDateRange);
    expect(res2[0]).toBe(5.6);
  });

  it('handles zero correctly', () => {
    const res = formatTooltip(0, 'Zero', mockProps, 'winPercentage', mockTrends, mockStats, mockDateRange);
    expect(res[0]).toBe('0%');

    const res2 = formatTooltip(0, 'Zero', mockProps, 'totalWins', mockTrends, mockStats, mockDateRange);
    expect(res2[0]).toBe(0);
  });

  it('handles negative values correctly', () => {
    const res = formatTooltip(-5.55, 'Negative', mockProps, 'scoreDiff', mockTrends, mockStats, mockDateRange);
    expect(res[0]).toBe(-5.5);
  });

  it('handles large numbers correctly', () => {
    const res = formatTooltip(1234.567, 'Large', mockProps, 'totalPoints', mockTrends, mockStats, mockDateRange);
    expect(res[0]).toBe(1234.6);
  });
});
