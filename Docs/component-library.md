# Component Library

## Overview

The Volleyball League Management Platform is built using a modular component-based architecture. This document outlines the key components used in the application, their props, and usage patterns.

## UI Component Library

The application uses a set of base UI components from shadcn/ui, which are built on top of Radix UI primitives. These components provide accessibility and customizability.

### Core UI Components

- **Button**: Multi-purpose button component with variants
- **Card**: Container for related information
- **Dialog**: Modal dialog for focused interactions
- **Form**: Form components with validation integration
- **Input**: Text input fields
- **Select**: Dropdown selection component
- **Toggle**: Boolean toggle control
- **Toast**: Notification system

## Feature Components

### PlayerCard

Displays player information including stats and achievements.

**Props**:
```typescript
interface PlayerCardProps {
  player: Player & { 
    matches: Array<{ won: boolean, date: string }>, 
    stats: { won: number, lost: number } 
  };
  onEdit?: (player: Player) => void;
  onDelete?: (id: number) => void;
}
```

**Usage**:
```jsx
<PlayerCard
  player={player}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### PlayerSelector

Component for selecting players for a team.

**Props**:
```typescript
interface PlayerSelectorProps {
  players: Player[];
  selectedPlayers: number[];
  maxPlayers?: number;
  onSelect: (playerId: number) => void;
  className?: string;
}
```

**Usage**:
```jsx
<PlayerSelector
  players={allPlayers}
  selectedPlayers={teamOnePlayers}
  onSelect={handlePlayerSelect}
  maxPlayers={3}
/>
```

### GameHistory

Displays a list of recorded games.

**Props**:
```typescript
interface GameHistoryProps {
  games: Array<{
    id: number;
    date: string;
    teamOnePlayers: string[];
    teamTwoPlayers: string[];
    teamOneGamesWon: number;
    teamTwoGamesWon: number;
  }>;
}
```

**Usage**:
```jsx
<GameHistory games={matches} />
```

### PerformanceTrend

Chart component showing player performance trends over time.

**Props**:
```typescript
interface PerformanceTrendProps {
  isExporting?: boolean;
}
```

**Usage**:
```jsx
<PerformanceTrend isExporting={isExporting} />
```

### PlayerAchievements

Displays achievements earned by a player.

**Props**:
```typescript
interface PlayerAchievementsProps {
  playerId: number;
  compact?: boolean;
}
```

**Usage**:
```jsx
<PlayerAchievements playerId={1} compact={true} />
```

### StatCard

Generic card for displaying statistical information.

**Props**:
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}
```

**Usage**:
```jsx
<StatCard
  title="Win Rate"
  value="75%"
  description="Last 30 days"
  icon={<TrophyIcon />}
/>
```

### FloatingActionButton

Floating action button for recording new games.

**Props**:
```typescript
interface FloatingActionButtonProps {
  onRecordGame: () => void;
}
```

**Usage**:
```jsx
<FloatingActionButton onRecordGame={handleRecordGame} />
```

### DailyWins

Component for tracking daily win records.

**Props**: None

**Usage**:
```jsx
<DailyWins />
```

## Page Components

### Dashboard

Main dashboard page displaying performance trends and recent matches.

### Players

Page for managing players, displaying player cards, and providing add/edit functionality.

### GameHistory

Page for viewing the complete history of recorded matches.

### Results

Page displaying team and player rankings, statistics, and achievements.

### RecordMatch

Page with a form for recording new matches.

## Utility Hooks

### useToast

Hook for managing toast notifications.

**Usage**:
```javascript
const { toast } = useToast();
toast({ title: "Success", description: "Operation completed" });
```

### useIsMobile

Hook for detecting mobile device viewport.

**Usage**:
```javascript
const isMobile = useIsMobile();
```

## Component Usage Guidelines

1. **Reusability**: Prefer reusable components with clear prop interfaces
2. **Composition**: Build complex UIs through composition of smaller components
3. **Accessibility**: Ensure components are keyboard navigable and screen reader friendly
4. **Responsive Design**: Components should adapt to different screen sizes
5. **Performance**: Optimize rendering with memoization when appropriate