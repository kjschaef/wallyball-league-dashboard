# Data Visualization

## Overview

The Data Visualization feature provides interactive charts, graphs, and visual representations of volleyball performance data. It helps users understand player and team performance trends, compare statistics, and identify patterns over time.

## Chart Types

### Performance Trend Chart

A line chart that visualizes player performance metrics over time.

**Features:**
- Win percentage or total wins visualization
- Multiple player comparison
- Toggle between recent and all-time data
- Weekly or daily data points
- Inactivity penalty visualization
- Interactive tooltips

**Implementation:**
```typescript
<LineChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis
    dataKey="date"
    tickFormatter={(date) => showAllData 
      ? format(parseISO(date), "MMM d")
      : `Week of ${format(parseISO(date), "MMM d")}`
    }
  />
  <YAxis
    domain={metric === 'winPercentage' ? [0, 100] : [0, 'auto']}
    tickFormatter={(value) => metric === 'winPercentage' ? `${Math.round(value)}%` : `${Math.round(value)}`}
    label={{ 
      value: metric === 'winPercentage' ? 'Win %' : 'Total Wins', 
      angle: -90, 
      position: 'insideLeft',
      style: { textAnchor: 'middle' }
    }}
  />
  <Tooltip />
  <Legend />
  {playerStats
    .filter(player => /* filtering logic */)
    .map((player, index) => (
      <Line
        key={player.id}
        type="monotone"
        dataKey={player.name}
        stroke={COLORS[index % COLORS.length]}
        activeDot={{ r: 8 }}
        strokeWidth={recentPlayerIds.has(player.id) ? 2.5 : 1.5}
      />
    ))}
</LineChart>
```

### Team Performance Cards

Visual cards displaying team composition performance statistics.

**Features:**
- Win/loss record display
- Win percentage calculation
- Visual indication of performance level
- Minimum game threshold filtering

**Implementation:**
```jsx
{teamStats.map(([team, stats]) => (
  <div
    key={team}
    className="flex justify-between items-center bg-muted/40 p-2 rounded mb-1"
  >
    <span className="font-medium">{team}</span>
    <div className="flex items-center space-x-4">
      <span className="text-sm">
        {stats.wins}W - {stats.losses}L
      </span>
      <span
        className={cn(
          "font-bold",
          stats.winRate > 0.55 ? "text-green-600" : stats.winRate < 0.45 ? "text-red-600" : ""
        )}
      >
        {(stats.winRate * 100).toFixed(0)}%
      </span>
    </div>
  </div>
))}
```

### Total Playing Time Visualization

Bar chart showing player participation by total playing time.

**Features:**
- Comparative time visualization
- Sorted by highest to lowest time
- Responsive bar widths
- Precise time display in hours

**Implementation:**
```jsx
{players?.sort((a, b) => (b.stats.totalMatchTime || 0) - (a.stats.totalMatchTime || 0))
  .map((player) => (
  <div 
    key={player.id}
    className="flex items-center gap-2 mb-2"
    title={`Total playing time: ${player.stats.totalMatchTime} hours`}
  >
    <div className="w-24 truncate">{player.name}</div>
    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
      <div 
        className="h-full bg-primary transition-all duration-500"
        style={{ 
          width: `${(player.stats.totalMatchTime / Math.max(...players.map(p => p.stats.totalMatchTime || 0))) * 100}%` 
        }}
      />
    </div>
    <div className="w-20 text-right">
      {player.stats.totalMatchTime}h
    </div>
  </div>
))}
```

### Match History Visualization

Visual representation of match outcomes with team composition and scores.

**Features:**
- Clear team composition display
- Visual indication of winning team
- Chronological ordering
- Optional filtering by date range

**Implementation:**
```jsx
{filteredMatches.map((match) => (
  <div key={match.id} className="flex flex-col py-1.5 px-3 border-b last:border-b-0 hover:bg-muted/50">
    <div className="grid grid-cols-1 gap-1.5">
      <div className={cn(
          "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium text-sm",
          match.teamOneGamesWon > match.teamTwoGamesWon ? "text-green-600 dark:text-green-500" : ""
        )}>
          <div className="font-bold tabular-nums text-center">
            {match.teamOneGamesWon}
          </div>
          <div className="min-w-0">
            {formatTeam([match.teamOnePlayerOneId, match.teamOnePlayerTwoId, match.teamOnePlayerThreeId])}
          </div>
        </div>
        {/* Team Two */}
        <div className={cn(
          "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium text-sm",
          match.teamTwoGamesWon > match.teamOneGamesWon ? "text-green-600 dark:text-green-500" : ""
        )}>
          <div className="font-bold tabular-nums text-center">
            {match.teamTwoGamesWon}
          </div>
          <div className="min-w-0">
            {formatTeam([match.teamTwoPlayerOneId, match.teamTwoPlayerTwoId, match.teamTwoPlayerThreeId])}
          </div>
        </div>
    </div>
  </div>
))}
```

## Data Export

The data visualization feature includes export capabilities for sharing insights.

**Features:**
- Export dashboard as PNG image
- Customized chart formatting for export
- High-resolution output
- Automatic file naming with date

**Implementation:**
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
    if (element) {
      element.style.width = originalWidth;
    }
    setIsExporting(false);
  }
};
```

## Color Scheme

The data visualization features use a consistent color palette to ensure visual clarity and aesthetic appeal:

```typescript
const COLORS = [
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Turquoise
  "#FFD93D", // Sun Yellow
  "#6C5CE7", // Deep Purple
  "#A8E6CF", // Mint Green
  "#FF8B94", // Light Pink
  "#45B7D1", // Sky Blue
  "#98CE00", // Lime Green
  "#FF71CE", // Hot Pink
  "#01CDFE", // Electric Blue
  "#05FFA1", // Neon Green
  "#B967FF", // Bright Purple
];
```

## Technology Stack

The data visualization features are implemented using:

- **Recharts**: Primary charting library for React
- **HTML2Canvas**: For exporting visualizations as images
- **Tailwind CSS**: For styling and responsive design
- **date-fns**: For date formatting and manipulation

## Best Practices

1. **Design Principles**
   - Use consistent color schemes across visualizations
   - Employ appropriate chart types for the data being displayed
   - Include clear labels, axes, and legends
   - Ensure responsive design for all screen sizes

2. **User Experience**
   - Provide interactive elements (tooltips, toggles)
   - Support filtering and customization options
   - Ensure visualizations are accessible
   - Maintain visual hierarchy to highlight important data

3. **Performance**
   - Optimize rendering for large datasets
   - Use appropriate data aggregation techniques
   - Implement memoization for expensive calculations
   - Ensure smooth animations and transitions

4. **Data Accuracy**
   - Apply consistent calculation methods
   - Clearly indicate data sources and processing
   - Handle edge cases appropriately (e.g., no data, extreme values)
   - Provide appropriate context for metrics