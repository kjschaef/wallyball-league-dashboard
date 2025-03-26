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

### Backend Calculation Logic (Pseudocode)

```
For each player:
  1. Group matches by date
  2. For each unique date:
     - Count total games played that day
     - Add 90 minutes to total time (one session per day)
  3. Calculate final stats:
     totalMatchTime = sum of all daily sessions (in hours)
     totalGames = sum of all games across all days
     averageGameLength = (totalMatchTime * 60) / totalGames (in minutes)
```

### Data Structures

```
PlayerStats {
  averageGameLength: number (minutes)
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
- Display average game length rounded to nearest minute
- Show total playing time in hours
- Include tooltip explaining "90-minute daily session" calculation
```

## Success Criteria
- Accurate calculation of average game length based on daily sessions
- Consistent display across all player cards
- Clear and understandable presentation of time statistics