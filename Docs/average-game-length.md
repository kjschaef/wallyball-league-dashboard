
# Player Game Time Feature Specification

## Overview
Display player-specific total game time statistics based on daily match sessions.

## Technical Requirements

### Data Model
- Use existing match data from the database
- Calculate based on fixed 90 minute daily session duration
- Total time calculated as: 90 minutes per unique day played

### API Changes
1. Update `/api/players` endpoint to include:
   - `totalMatchTime`: number (in hours)

### Frontend Implementation
1. Update PlayerCard component:
   - Remove average game length display
   - Show total playing time in hours
   - Include within existing stats section

2. Update Results page:
   - Rename "Game Duration Stats" section to "Total Playing Time"
   - Remove toggle switch for average duration
   - Show only total time bar chart
   - Responsive chart layout that adjusts to screen width
   - Color-coded bars matching player colors from other charts

### UI/UX Requirements
- Display format: "Total Time: XX hours"
- Include tooltip explaining "90-minute daily session" calculation
- Bar chart requirements:
  - Y-axis: Hours of total time
  - X-axis: Player names
  - Tooltips showing exact values
  - Bars sorted by total time in descending order
  - Consistent color scheme with existing charts
  - Smooth transition animation when updating

## Implementation Steps

### Backend Calculation Logic (Pseudocode)

```
For each player:
  1. Group matches by date
  2. For each unique date:
     - Add 90 minutes to total time (one session per day)
  3. Calculate final stats:
     totalMatchTime = sum of all daily sessions (in hours)
```

### Data Structures

```
PlayerStats {
  totalMatchTime: number (hours)
  totalGames: number
}

Match {
  date: timestamp
  teamOneGamesWon: number
  teamTwoGamesWon: number
  // other match data...
}
```

### Frontend Display

```
- Show total playing time in hours
- Include tooltip explaining "90-minute daily session" calculation
```

## Success Criteria
- Accurate calculation of total playing time based on daily sessions
- Consistent display across all player cards
- Clear and understandable presentation of time statistics
