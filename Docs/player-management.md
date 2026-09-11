# Player Management

## Overview

The Player Management feature provides comprehensive capabilities for tracking and managing volleyball players. It allows for the creation, viewing, editing, and deletion of player profiles, as well as displaying their performance statistics and achievements.

## Key Features

1. **Player Profile Management**
   - Create new player profiles with name and start year
   - Edit existing player information
   - Manage player activity status (Active vs. Inactive) with symmetric reactivation
   - Mark players inactive or delete (safely marks inactive to preserve past match history; true delete for 0-match entries)
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
  isActive: boolean("is_active"),
}, (table) => ({
  deletedAtIdx: index("players_deleted_at_idx").on(table.deletedAt),
  isActiveIdx: index("players_is_active_idx").on(table.isActive),
}));
```

### API Endpoints

- `GET /api/players` - Retrieve all players with statistics, active status, and match history
- `POST /api/players` - Create a new active player
- `PUT /api/players` - Update player details or toggle active status (`isActive: boolean | null`)
- `DELETE /api/players?id=:id` - Deletes players without match history, or marks players with matches as inactive (`is_active = false`)

### UI Components

The player management feature utilizes the following components:

- **PlayerCards**: Displays player cards on the Dashboard with statistics and provides CRUD operations
- **Player Dialog**: Form for creating and editing player information

## User Interaction Flow

1. User views the Player Cards section on the Dashboard
2. User can:
   - View active and inactive players with win rates, records, and power rankings
   - Click "Add Player" to create a new player
   - Click "Mark Inactive" on an active player card to move them to Inactive Players
   - Click "Mark Active" on an inactive player card to move them to Active Players
   - Click "Edit" on a player card to modify player details
   - Click "Delete" on players with 0 matches to permanently remove accidental records
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