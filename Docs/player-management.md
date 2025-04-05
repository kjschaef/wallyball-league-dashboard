# Player Management

## Overview

The Player Management feature provides comprehensive capabilities for tracking and managing volleyball players. It allows for the creation, viewing, editing, and deletion of player profiles, as well as displaying their performance statistics and achievements.

## Key Features

1. **Player Profile Management**
   - Create new player profiles with name and start year
   - Edit existing player information
   - Delete players (which also removes associated match records)
   - View player details including statistics and achievements

2. **Player Performance Tracking**
   - Win/loss record tracking
   - Win percentage calculation
   - Adjustment for periods of inactivity
   - Performance trend visualization

3. **Player Achievements**
   - Automatic achievement unlocking based on performance
   - Visual representation through achievement badges
   - Detailed achievement descriptions on hover

## Technical Implementation

### Data Model

Players are stored in the database with the following schema:

```typescript
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startYear: integer("start_year"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### API Endpoints

- `GET /api/players` - Retrieve all players with statistics
- `POST /api/players` - Create a new player
- `GET /api/players/:id` - Get a specific player by ID
- `PUT /api/players/:id` - Update an existing player
- `DELETE /api/players/:id` - Delete a player and associated matches

### UI Components

The player management feature utilizes the following components:

- **PlayerCard**: Displays player information, statistics, and achievements
- **PlayerAchievements**: Shows achievement badges earned by the player
- **Players Page**: Manages the list of players and provides CRUD operations
- **Player Dialog**: Form for creating and editing player information

### Performance Calculation

The win percentage calculation includes an inactivity penalty:

```typescript
export function calculatePenalizedWinPercentage(player) {
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

## User Interaction Flow

1. User navigates to the Players page
2. User can:
   - View the list of players sorted by penalized win percentage
   - Click "Add Player" to create a new player
   - Click "Edit" on a player card to modify player details
   - Click "Delete" on a player card to remove the player
3. When adding or editing a player, a dialog appears with a form
4. Upon submission, the player list updates with the changes

## UI Screenshots

The Players page displays player cards in a responsive grid layout. Each player card shows:

- Player name
- Start year
- Win/loss record
- Win percentage (with inactivity adjustment)
- Achievement badges
- Edit and delete options

## Best Practices

1. **Data Integrity**
   - Confirm deletion of players to prevent accidental data loss
   - Cascade deletion to remove associated match records
   - Validate input data using form validation

2. **Performance**
   - Use React Query for efficient data fetching and caching
   - Implement optimistic updates for UI responsiveness
   - Sort players client-side to reduce server load

3. **User Experience**
   - Provide visual feedback for actions (toasts for success/error)
   - Ensure responsive design for all device sizes
   - Make achievements visually distinctive and meaningful