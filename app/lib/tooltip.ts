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
    let penaltyInfo = '';

    const currentDate = props.payload?.date;
    const playerTrend = trendsData.find((p: any) => p.name === name);
    let penaltyValue = 0;

    if (playerTrend?.dailyStats) {
      const stats = playerTrend.dailyStats[currentDate];

      if (stats?.inactivityPenalty !== undefined) {
        penaltyValue = stats.inactivityPenalty;
      } else {
        const allDates = Object.keys(playerTrend.dailyStats).sort();
        const previousDates = allDates.filter((d) => d <= currentDate);
        if (previousDates.length > 0) {
          const mostRecentDate = previousDates[previousDates.length - 1];
          const mostRecentStats = playerTrend.dailyStats[mostRecentDate];
          penaltyValue = mostRecentStats?.inactivityPenalty || 0;
        }
      }
    }

    if (penaltyValue === 0) {
      const isLatestDate = currentDate && dateRange[dateRange.length - 1] === currentDate;
      if (isLatestDate) {
        const currentPlayer = playerStats.find((p: any) => p.name === name);
        penaltyValue = currentPlayer?.inactivityPenalty || 0;
      }
    }

    if (penaltyValue > 0) {
      penaltyInfo = ` (-${Math.round(penaltyValue)}% penalty)`;
    }

    return [`${formattedValue}%${penaltyInfo}`, name];
  }

  return [formattedValue, name];
}

export default formatTooltip;

