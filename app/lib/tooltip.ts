export function formatTooltip(
  value: number,
  name: string,
  _props: unknown,
  metric: string,
  _trendsData: unknown[],
  _playerStats: unknown[],
  _dateRange: string[]
) {
  const formattedValue = Number(value.toFixed(1));

  if (metric === 'winPercentage') {
    return [`${formattedValue}%`, name];
  }

  return [formattedValue, name];
}

export default formatTooltip;
