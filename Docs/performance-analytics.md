# Performance Analytics

## Overview

The Performance Analytics feature provides comprehensive data visualization and analysis tools for tracking player and team performance over time. It enables users to identify trends, compare performance metrics, and gain deep insights into volleyball match outcomes through multiple visualization types and analytical approaches.

## Key Features

1. **Performance Trend Visualization**
   - Win percentage trends over time
   - Total wins tracking 
   - Weekly or cumulative data views


2. **Player Performance Radar**
   - Multi-dimensional player comparison
   - Customizable performance metrics
   - Interactive radar chart visualization
   - Up to 3-player simultaneous comparison

3. **Head-to-Head Analysis**
   - Compare two players' performances when playing together vs. against each other
   - Win/loss records for different player combinations
   - Win rate calculations for different team compositions

4. **Advanced Performance Metrics**
   - Win Rate
   - Consistency (streak analysis)
   - Improvement (recent vs. historical performance)
   - Play Volume (participation frequency)

5. **Export Capabilities**
   - Dashboard export as image
   - Performance chart sharing

## Technical Implementation

### Performance Radar Component

The PlayerPerformanceRadar component allows multi-dimensional comparison of players across several key performance metrics:

```typescript
export function PlayerPerformanceRadar() {
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<string[]>(performanceMetrics.map(m => m.name));
  const [expandedView, setExpandedView] = useState(false);
  
  // Prepare data for the radar chart
  const radarData = metrics.map(metricName => {
    const metric = performanceMetrics.find(m => m.name === metricName);
    if (!metric) return null;
    
    const dataPoint: Record<string, any> = { 
      metric: metric.displayName,
      fullMark: 100,
    };
    
    players
      .filter(player => selectedPlayers.includes(player.id))
      .forEach(player => {
        const value = metric.calculate(player, players);
        dataPoint[player.name] = value;
      });
    
    return dataPoint;
  }).filter(Boolean);
  
  // Component rendering with RadarChart from recharts
}
```

### Performance Metrics Implementation

The application calculates several advanced metrics for player performance:

```typescript
const performanceMetrics: PerformanceMetric[] = [
  {
    name: "winRate",
    displayName: "Win Rate",
    description: "Percentage of games won",
    calculate: (player) => {
      // Calculate win percentage directly
      const total = player.stats.won + player.stats.lost;
      return total > 0 ? (player.stats.won / total) * 100 : 0;
    },
    scale: [0, 100],
  },
  {
    name: "consistency",
    displayName: "Consistency",
    description: "Measure of how consistently a player performs across games",
    calculate: (player) => {
      // Streak analysis calculation
      // Higher score = fewer changes between winning and losing
    },
    scale: [0, 100],
  },
  {
    name: "improvement",
    displayName: "Improvement",
    description: "How much a player has improved recently compared to their historical performance",
    calculate: (player) => {
      // Compare recent performance to historical performance
      // Map to 0-100 scale: 0 = decline, 50 = neutral, 100 = improvement
    },
    scale: [0, 100],
  },
  {
    name: "volume",
    displayName: "Play Volume",
    description: "How frequently a player participates in games relative to other players",
    calculate: (player, allPlayers) => {
      // Calculate normalized score based on match participation
    },
    scale: [0, 100],
  },
];
```

### Head-to-Head Analysis

The AdvancedPlayerDashboard component includes detailed head-to-head analysis:

```typescript
// Calculate head-to-head statistics between two players
const getHeadToHeadStats = () => {
  if (!selectedPlayerId || !comparisonPlayerId) return null;
  
  const player1 = players.find(p => p.id === selectedPlayerId);
  const player2 = players.find(p => p.id === comparisonPlayerId);
  
  // Find matches where both players participated
  const relevantMatches = player1.matches.filter(match1 => {
    return player2.matches.some(match2 => match2.id === match1.id);
  });
  
  // Calculate statistics for when they played on same team vs. opposite teams
  // Return win rates, win-loss records, and other metrics
};
```



### Dashboard Share Feature

The dashboard sharing feature uses html2canvas to capture the dashboard content as an image:

```typescript
const shareAsImage = async () => {
  let originalWidth = '';
  try {
    setIsExporting(true);
    const element = document.getElementById('analytics-content');
    if (!element) return;

    // Save original width and get computed height
    originalWidth = element.style.width;
    const height = element.getBoundingClientRect().height;

    // Set export width
    element.style.width = '1200px';
    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      width: 1200,
      height: Math.ceil(height),
      // Additional options...
    });

    // Download the image
    // ...
  } catch (error) {
    console.error('Error creating image:', error);
  } finally {
    // Restore original styling
    // ...
    setIsExporting(false);
  }
};
```

## Data Visualization Components

The performance analytics feature uses several visualization components:

1. **Radar Charts**
   - Multi-dimensional comparison of player metrics
   - Interactive selection of metrics and players
   - Tooltips with detailed performance information
   - Expandable view for detailed analysis

2. **Line Charts**
   - Displays win percentage or total wins over time
   - Color-coded player lines
   - Interactive tooltips with detailed information
   - Responsive design for all screen sizes

3. **Team Performance Analysis**
   - Shows win/loss records for various team combinations
   - Head-to-head performance metrics
   - Win rate comparisons for playing with vs. against specific players

4. **Monthly Performance Trends**
   - Month-by-month performance tracking
   - Win rate visualization over time
   - Detection of improvement or decline in performance

## UI Interactions

The performance analytics interface provides these user interactions:

1. **Player Selection**
   - Select up to 3 players for radar chart comparison
   - Select primary and comparison players for head-to-head analysis
   - Filter by most active players

2. **Metric Configuration**
   - Toggle different performance metrics on/off
   - View detailed descriptions of each metric via info tooltips
   - Switch between expanded and compact views

3. **Data Interpretation**
   - Hover over chart elements to see detailed metrics

4. **Data Export**
   - Click "Share as Image" to download dashboard as PNG
   - Generated image includes all visualization components

## Best Practices

1. **Data Accuracy**

   - Use consistent calculation methods across the application
   - Clearly indicate data sources and filtering
   - Provide sufficient context for performance metrics

2. **Visual Design**
   - Consistent color coding for players
   - Clear labels and legends
   - Responsive design for all device sizes
   - Appropriate scale for visualizations

3. **Performance**
   - Efficient data processing
   - Memoization of expensive calculations
   - Responsive UI during export operations
   - Limit simultaneous comparisons to maintain clarity