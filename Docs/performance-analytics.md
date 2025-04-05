# Performance Analytics

## Overview

The Performance Analytics feature provides data visualization and analysis tools for tracking player and team performance over time. It enables users to identify trends, compare performance metrics, and gain insights into volleyball match outcomes.

## Key Features

1. **Performance Trend Visualization**
   - Win percentage trends over time
   - Total wins tracking
   - Weekly or cumulative data views
   - Inactivity penalty visualization

2. **Filtering Options**
   - Recent vs. all-time data views
   - Metric selection (win percentage, total wins)
   - Weekly averages vs. daily data points

3. **Export Capabilities**
   - Dashboard export as image
   - Performance chart sharing

4. **Team Analytics**
   - Best performing teams identification
   - Common team matchup analysis
   - Season statistics summaries

## Technical Implementation

### Performance Trend Component

The PerformanceTrend component is the core implementation of the performance analytics feature. It calculates and displays performance metrics over time for all players.

Key implementation aspects:

```typescript
export function PerformanceTrend({ isExporting = false }: PerformanceTrendProps) {
  const [metric, setMetric] = useState<'winPercentage' | 'totalWins'>('winPercentage');
  const [showAllData, setShowAllData] = useState(false);
  
  // Data fetching and processing
  // ...

  // Calculate player statistics for each time period
  // Apply inactivity penalties for missing data periods
  // Generate chart data for selected metrics
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{/* Metric title */}</CardTitle>
        <div className="flex flex-col gap-2">
          {/* Toggle controls for metric and time range */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              {/* Chart components */}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Inactivity Calculation

Performance analytics incorporates inactivity penalties to provide a more accurate representation of player performance:

```typescript
// Calculate inactivity penalty:
const daysSinceLastActivity = Math.floor(
  (currentDate.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000)
);

// No penalty for first 2 weeks
const gracePeriodDays = 14;
const excessInactiveDays = Math.max(0, daysSinceLastActivity - gracePeriodDays);

// Calculate weeks inactive beyond grace period (5% per week)
const weeksInactive = Math.floor(excessInactiveDays / 7);
const penaltyPerWeek = 0.05; // 5% per week
const maxPenalty = 0.5; // 50% maximum penalty

// Calculate penalty gradually
const inactivityPenalty = Math.min(maxPenalty, weeksInactive * penaltyPerWeek);
const decayFactor = 1 - inactivityPenalty;

// Apply penalty to metrics
processedDataPoint[player.name] = lastValue * decayFactor;
```

### Dashboard Share Feature

The dashboard sharing feature uses html2canvas to capture the dashboard content as an image:

```typescript
const shareAsImage = async () => {
  let originalWidth = '';
  try {
    setIsExporting(true);
    const element = document.getElementById('dashboard-content');
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
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `volleyball-dashboard-${format(new Date(), 'yyyy-MM-dd')}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast({
          title: "Image downloaded successfully",
          variant: "success",
        });
      }
    }, 'image/png');
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

1. **Line Charts**
   - Displays win percentage or total wins over time
   - Color-coded player lines
   - Interactive tooltips with detailed information
   - Responsive design for all screen sizes

2. **Team Performance Cards**
   - Shows win/loss records for team compositions
   - Highlights top-performing teams
   - Filters teams by minimum game threshold

3. **Season Statistics**
   - Total matches played
   - Total games played
   - Average games per match

## UI Interactions

The performance analytics interface provides these user interactions:

1. **Metric Selection**
   - Toggle between win percentage and total wins
   - Switch between recent data and all-time data

2. **Tooltip Information**
   - Hover over data points to see detailed metrics
   - View inactivity penalty information when applicable
   - See exact dates and values

3. **Data Export**
   - Click "Share as Image" to download dashboard as PNG
   - Generated image includes all visualization components

## Best Practices

1. **Data Accuracy**
   - Apply inactivity penalties to prevent misleading statistics
   - Use consistent calculation methods across the application
   - Clearly indicate data sources and filtering

2. **Visual Design**
   - Consistent color coding for players
   - Clear labels and legends
   - Responsive design for all device sizes
   - Appropriate scale for visualizations

3. **Performance**
   - Efficient data processing
   - Memoization of expensive calculations
   - Responsive UI during export operations