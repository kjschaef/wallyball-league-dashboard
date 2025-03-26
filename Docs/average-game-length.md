# Average Game Length Feature Specification

## Overview
Add player-specific average game length statistics to display the typical duration of matches for each player.

## Technical Requirements

### Data Model
- Use existing match data from the database
- Calculate based on fixed 90 minute daily session duration
- Formula: `(90 minutes / total_games_played_that_day) * total_games_played`

### API Changes
1. Extend `/api/players` endpoint to include:
   - `averageGameLength`: number (in minutes)
   - `totalMatchTime`: number (in hours)

### Frontend Implementation
1. Add to PlayerCard component:
   - Display average game length in minutes
   - Show total playing time in hours
   - Include within existing stats section

2. Add to Results page:
   - New "Game Duration Stats" section with bar chart visualization
   - Toggle switch between "Average Game Duration" and "Total Playing Time"
   - Responsive chart layout that adjusts to screen width
   - Color-coded bars matching player colors from other charts

### UI/UX Requirements
- Display format: "Avg. Game: XX mins"
- Round to nearest minute
- Include tooltip explaining calculation method
- Bar chart requirements:
  - Y-axis: Minutes for average duration, Hours for total time
  - X-axis: Player names
  - Tooltips showing exact values
  - Bars sorted by duration/time in descending order
  - Consistent color scheme with existing charts
  - Smooth transition animation when toggling views

## Implementation Steps
1. Backend:
```typescript
interface PlayerStats {
  // Existing stats
  averageGameLength: number;
  totalMatchTime: number;
}

interface GameDurationData {
  playerId: number;
  playerName: string;
  averageGameLength: number;
  totalPlayingTime: number;
  totalGames: number;
}

// Calculation logic needs to be updated to reflect daily sessions.  This is complex and requires more information about the 'matches' data structure.  A placeholder is used for illustration.  A proper implementation would require understanding the match data format to accurately calculate daily game totals.

const gameStats = matches.reduce((acc, match) => {
  //This needs to be updated to account for daily sessions.  Example below assumes match data includes a 'date' property.
  const matchDate = match.date; // Assumes a 'date' property exists in the match object.
  const dailyGames = acc[matchDate] || { totalGames: 0, totalTime: 0 };
  const totalGamesForDay = match.teamOneGamesWon + match.teamTwoGamesWon;
  dailyGames.totalGames += totalGamesForDay;
  dailyGames.totalTime += 90; // 90 minutes per daily session
  acc[matchDate] = dailyGames; //Store stats by date.
  return acc;
}, {});


//Further processing needed to calculate averageGameLength and totalMatchTime  based on the daily games data.


```

2. Frontend:
```typescript
<StatDisplay
  label="Avg. Game"
  value={`${Math.round(player.stats.averageGameLength)} mins`}
  tooltip="Based on 90-minute daily sessions"
/>
```

## Success Criteria
- Accurate calculation of average game length based on daily sessions
- Consistent display across all player cards
- Clear and understandable presentation of time statistics