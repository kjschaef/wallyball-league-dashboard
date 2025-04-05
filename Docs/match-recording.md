# Match Recording

## Overview

The Match Recording feature enables users to document wallyball matches, including player participation and game outcomes. This feature is fundamental to the platform as it provides the data foundation for all statistics, trends, and achievements.

## Key Features

1. **Match Creation**
   - Record date of the match
   - Select players for each team (1-3 players per team)
   - Record games won by each team
   - Submit match results

2. **Match Visualization**
   - View recent matches on the dashboard
   - Access complete match history
   - Filter matches by date range

3. **Statistical Processing**
   - Automatic calculation of player statistics based on matches
   - Team composition analytics
   - Win/loss tracking

## Technical Implementation

### Data Model

Matches are stored in the database with the following schema:

```typescript
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  // Team One Players
  teamOnePlayerOneId: integer("team_one_player_one_id").references(() => players.id),
  teamOnePlayerTwoId: integer("team_one_player_two_id").references(() => players.id),
  teamOnePlayerThreeId: integer("team_one_player_three_id").references(() => players.id),
  // Team Two Players
  teamTwoPlayerOneId: integer("team_two_player_one_id").references(() => players.id),
  teamTwoPlayerTwoId: integer("team_two_player_two_id").references(() => players.id),
  teamTwoPlayerThreeId: integer("team_two_player_three_id").references(() => players.id),
  // Scores
  teamOneGamesWon: integer("team_one_games_won").notNull(),
  teamTwoGamesWon: integer("team_two_games_won").notNull(),
  date: timestamp("date").defaultNow(),
});
```

### Match Recording Form Schema

Form validation is implemented using Zod:

```typescript
const gameFormSchema = z.object({
  teamOnePlayers: z.array(z.number()).min(1, "At least one player is required").max(3),
  teamTwoPlayers: z.array(z.number()).min(1, "At least one player is required").max(3),
  teamOneGamesWon: z.coerce.number().min(0),
  teamTwoGamesWon: z.coerce.number().min(0),
  date: z.date(),
});
```

### API Endpoints

- `GET /api/matches` - Retrieve all matches
- `POST /api/games` - Create a new match record

### UI Components

The match recording feature utilizes these components:

- **RecordMatch Form**: Dialog with form controls for recording match details
- **FloatingActionButton**: Quick access to the record match form
- **GameHistory**: Display of match history with team composition and scores
- **Calendar**: Date selection for match recording

## User Interaction Flow

1. User accesses the match recording function via:
   - Floating action button on the dashboard
   - Record Match page in navigation
   - "Record Game" button in the UI

2. User completes the match recording form:
   - Selects the date
   - Chooses players for Team One (up to 3)
   - Chooses players for Team Two (up to 3)
   - Enters games won by each team
   - Submits the form

3. Upon submission:
   - Data is saved to the database
   - Player statistics are updated
   - Match appears in history views
   - Potential achievements are unlocked
   - Success notification is displayed

## Match History Display

The match history is displayed in multiple views:

1. **Dashboard Recent Matches**: Shows the most recent day with matches
2. **Match History Page**: Shows the complete chronological history
3. **Results Page**: Shows match outcomes grouped by team composition

Each match display includes:
- Date of the match
- Team compositions (player names)
- Games won by each team
- Visual indication of the winning team

## Statistical Processing

Each recorded match triggers updates to:
- Individual player statistics
- Team composition win rates
- Achievement checking
- Performance trends

## Best Practices

1. **Data Validation**
   - Ensure at least one player per team
   - Validate game counts
   - Prevent duplicate submissions

2. **User Experience**
   - Provide clear feedback for form submission
   - Enable quick access to frequently used functions
   - Display recent matches for context

3. **Performance**
   - Use optimistic UI updates for responsive feel
   - Invalidate relevant queries after match creation
   - Efficiently process match data for statistics