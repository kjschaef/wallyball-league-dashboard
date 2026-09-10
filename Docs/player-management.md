# Player Management

## Overview

The Player Management feature provides comprehensive capabilities for tracking and managing volleyball players. It allows for the creation, viewing, editing, and deletion of player profiles, as well as displaying their performance statistics and achievements.

## Key Features

1. **Player Profile Management**
   - Create new player profiles with name and start year
   - Edit existing player information
   - Delete players (soft-deletes from rosters and rankings while preserving past match records)
   - View player details including statistics and achievements

2. **Player Performance Tracking**
   - Win/loss record tracking
   - Win percentage calculation

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
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  deletedAtIdx: index("players_deleted_at_idx").on(table.deletedAt),
}));
```

### API Endpoints

- `GET /api/players` - Retrieve all active players with statistics
- `POST /api/players` - Create a new player
- `GET /api/players/:id` - Get a specific active player by ID
- `PUT /api/players/:id` - Update an existing active player
- `DELETE /api/players?id=:id` / `DELETE /api/players/:id` - Soft-delete a player (sets `deleted_at = NOW()`, preserving match history)

### UI Components

The player management feature utilizes the following components:

- **PlayerCards**: Displays player cards on the Dashboard with statistics and provides CRUD operations
- **Player Dialog**: Form for creating and editing player information

## User Interaction Flow

1. User views the Player Cards section on the Dashboard
2. User can:
   - View active and inactive players with win rates, records, and power rankings
   - Click "Add Player" to create a new player
   - Click "Edit" on a player card to modify player details
   - Click "Delete" on a player card to remove the player
3. When adding or editing a player, a dialog appears with a form
4. Upon submission, the player cards update with the changes

## UI Layout

The Dashboard displays player cards in a responsive grid layout. Each player card shows:

- Player name
- Start year
- Win/loss record
- Win percentage
- Achievement badges
- Edit and delete options

## Best Practices

1. **Data Integrity**
   - Confirm deletion of players to prevent accidental data loss
   - Soft-delete players to preserve historical match integrity and past opponents' records
   - Validate input data using form validation

2. **Performance**
   - Use React Query for efficient data fetching and caching
   - Implement optimistic updates for UI responsiveness
   - Sort players client-side to reduce server load

3. **User Experience**
   - Provide visual feedback for actions (toasts for success/error)
   - Ensure responsive design for all device sizes
   - Make achievements visually distinctive and meaningful