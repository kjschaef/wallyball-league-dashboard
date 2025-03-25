
# Average Game Length Feature Specification

## Overview
Add player-specific average game length statistics to display the typical duration of matches for each player.

## Technical Requirements

### Data Model
- Use existing match data from the database
- Calculate based on fixed 1.5 hour (90 minute) match duration
- Formula: `(90 minutes / total_games_in_match) * total_games_played`

### API Changes
1. Extend `/api/players` endpoint to include:
   - `averageGameLength`: number (in minutes)
   - `totalMatchTime`: number (in hours)

### Frontend Implementation
1. Add to PlayerCard component:
   - Display average game length in minutes
   - Show total playing time in hours
   - Include within existing stats section

### UI/UX Requirements
- Display format: "Avg. Game: XX mins"
- Round to nearest minute
- Include tooltip explaining calculation method

## Implementation Steps

1. Backend:
```typescript
interface PlayerStats {
  // Existing stats
  averageGameLength: number;
  totalMatchTime: number;
}

// Calculation logic
const gameStats = matches.reduce((acc, match) => {
  const totalGames = match.teamOneGamesWon + match.teamTwoGamesWon;
  const avgGameLength = 90 / totalGames; // minutes per game
  return {
    totalGames: acc.totalGames + totalGames,
    totalTime: acc.totalTime + 90
  };
}, { totalGames: 0, totalTime: 0 });
```

2. Frontend:
```typescript
<StatDisplay
  label="Avg. Game"
  value={`${Math.round(player.stats.averageGameLength)} mins`}
  tooltip="Based on 1.5 hour matches"
/>
```

## Success Criteria
- Accurate calculation of average game length
- Consistent display across all player cards
- Clear and understandable presentation of time statistics
