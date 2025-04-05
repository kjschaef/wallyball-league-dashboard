# Inactivity System

## Overview

The Inactivity System is a feature that adjusts player performance metrics based on periods of inactivity. It helps maintain a fair and accurate representation of player performance by applying graduated penalties to players who haven't participated in matches for extended periods.

## Key Features

1. **Inactivity Detection**
   - Track player participation dates
   - Identify periods of inactivity

2. **Graduated Penalty System**
   - Apply increasing penalties based on inactivity duration
   - Grace period before penalties begin
   - Maximum penalty cap

3. **Transparent Visualization**
   - Visual indication of penalties in charts
   - Detailed penalty information in tooltips
   - Effect on player rankings

## Technical Implementation

### Inactivity Penalty Calculation

The core of the inactivity system is the `calculateInactivityPenalty` function:

```typescript
export function calculateInactivityPenalty(player: PlayerWithMatches) {
  const today = new Date();
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds
  const maxPenalty = 0.5; // 50% maximum penalty
  const penaltyPerWeek = 0.05; // 5% penalty per week after grace period
  
  // Make sure matches are in chronological order (oldest first)
  const sortedMatches = player.matches ? 
    [...player.matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : 
    [];
  
  // Get the last match date or creation date if no matches
  const lastMatch = sortedMatches.length > 0 
    ? new Date(sortedMatches[sortedMatches.length - 1].date) 
    : (player.createdAt ? new Date(player.createdAt) : new Date());
  
  // Calculate inactivity time in milliseconds
  const inactiveTime = today.getTime() - lastMatch.getTime();
  
  // Calculate excess inactive time (after 2-week grace period)
  const excessInactiveTime = Math.max(0, inactiveTime - twoWeeksInMs);
  
  // Calculate weeks inactive beyond grace period
  const weeksInactive = Math.floor(excessInactiveTime / (7 * 24 * 60 * 60 * 1000));
  
  // Calculate penalty (5% per week after grace period, up to 50%)
  const penaltyPercentage = Math.min(maxPenalty, weeksInactive * penaltyPerWeek);
  
  return {
    lastMatch,
    weeksInactive,
    penaltyPercentage,
    decayFactor: 1 - penaltyPercentage
  };
}
```

### Applying Penalties to Win Percentage

The inactivity penalty is applied to win percentages using the `calculatePenalizedWinPercentage` function:

```typescript
export function calculatePenalizedWinPercentage(player: PlayerWithMatches & { 
  stats: { won: number, lost: number } 
}) {
  // Calculate base win percentage
  const total = player.stats.won + player.stats.lost;
  const baseWinRate = total > 0 ? (player.stats.won / total) * 100 : 0;
  
  // Apply inactivity penalty
  const { penaltyPercentage, decayFactor } = calculateInactivityPenalty(player);
  const penalizedWinRate = baseWinRate * decayFactor;
  
  return {
    baseWinRate,
    penalizedWinRate,
    penaltyPercentage,
    decayFactor
  };
}
```

### Weekly Data Point Penalty Application

For performance trend charts, penalties are applied to each data point based on the inactivity period relative to that point:

```typescript
// Calculate inactivity as of the current week date, not today
const currentDate = currentWeekDate;
const lastActivityDate = lastActiveWeekDate;

// Calculate inactivity time in days
const daysSinceLastActivity = Math.floor(
  (currentDate.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000)
);

// No penalty for first 2 weeks
const gracePeriodDays = 14;
const excessInactiveDays = Math.max(0, daysSinceLastActivity - gracePeriodDays);

// Calculate weeks inactive beyond grace period (5% per week)
const weeksInactive = Math.floor(excessInactiveDays / 7);
const penaltyPerWeek = 0.05; // 5% per week
const maxPenalty = 0.5; // 50% maximum penalty

// Calculate penalty gradually
const inactivityPenalty = Math.min(maxPenalty, weeksInactive * penaltyPerWeek);
const decayFactor = 1 - inactivityPenalty;

console.log(`Weekly view - ${player.name} on week of ${format(currentDate, 'MMM d')}: ${daysSinceLastActivity} days since activity, penalty: ${Math.round(inactivityPenalty * 100)}%`);
const penalizedValue = lastValue * decayFactor;

processedDataPoint[player.name] = penalizedValue;
// Store the penalty information
processedDataPoint[`${player.name}_penalty`] = inactivityPenalty;
```

## Penalty Scale

The inactivity penalty follows a graduated scale:

1. **0-2 weeks inactive**: No penalty (grace period)
2. **2-3 weeks inactive**: 5% penalty to win percentage
3. **3-4 weeks inactive**: 10% penalty to win percentage
4. **4-5 weeks inactive**: 15% penalty to win percentage
5. Each additional week: +5% penalty, up to a maximum of 50%

## User Interface Integration

### Player Sorting

Player sorting by performance incorporates the inactivity penalty:

```typescript
players
  .sort((a, b) => {
    // Calculate win percentages with inactivity penalty applied
    const { penalizedWinRate: aWinRate } = calculatePenalizedWinPercentage(a);
    const { penalizedWinRate: bWinRate } = calculatePenalizedWinPercentage(b);
    
    // Sort by penalized win percentage (highest first)
    return bWinRate - aWinRate;
  })
```

### Performance Chart Tooltips

The performance chart includes inactivity penalty information in tooltips:

```typescript
<Tooltip
  formatter={(value: number, name: string, entry: any) => {
    const formattedValue = Number(value.toFixed(1));
    let displayValue = metric === 'winPercentage' 
      ? `${formattedValue}%` 
      : formattedValue;
    
    // Check if this player has an inactivity penalty applied
    const penaltyKey = `${name}_penalty`;
    if (entry.payload[penaltyKey]) {
      const penalty = entry.payload[penaltyKey];
      const penaltyPercent = Math.round(penalty * 100);
      
      // Only show penalty if it's significant (>1%)
      if (penaltyPercent > 1) {
        displayValue = `${displayValue} (${penaltyPercent}% inactive penalty)`;
      }
    }
    
    return [displayValue, name];
  }}
/>
```

## Benefits

1. **Fair Representation**: Ensures that performance metrics reflect current abilities rather than historical performance.

2. **Activity Encouragement**: Motivates players to participate regularly to maintain their rankings.

3. **Transparent Adjustments**: Clearly indicates when and why penalties are applied, maintaining trust in the system.

4. **Gradual Impact**: The graduated penalty system acknowledges that short breaks shouldn't significantly impact rankings.

## Best Practices

1. **Clear Communication**
   - Indicate when inactivity penalties are applied
   - Display both raw and adjusted metrics when relevant
   - Explain the penalty system to users

2. **Consistent Application**
   - Apply the same penalty calculation across all features
   - Use consistent timeframes for all players
   - Ensure grace periods are uniformly applied

3. **Fair Implementation**
   - Balance penalties to encourage activity without being punitive
   - Consider legitimate reasons for inactivity
   - Set reasonable maximums for penalties

4. **Data Accuracy**
   - Ensure accurate activity tracking
   - Use consistent date handling
   - Handle edge cases appropriately