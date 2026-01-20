export function formatTooltip(
  value: number,
  name: string,
  props: any,
  metric: string,
  trendsData: any[],
  playerStats: any[],
  dateRange: string[]
) {
  const formattedValue = Number(value.toFixed(1));

  if (metric === 'winPercentage') {
    return [`${formattedValue}%`, name];
  }

  return [formattedValue, name];
}

export default formatTooltip;
