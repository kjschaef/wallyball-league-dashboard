'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Mock data to visualize the chart as shown in the screenshot
const mockPlayers = [
  { id: 1, name: 'Lance', color: '#FF6B6B' },
  { id: 2, name: 'Nate', color: '#4E4EFF' },
  { id: 3, name: 'Shortt', color: '#62D962' },
  { id: 4, name: 'Vamsi', color: '#FF7E67' },
  { id: 5, name: 'Keith', color: '#BADA55' },
  { id: 6, name: 'Relly', color: '#FFD700' },
  { id: 7, name: 'Trevor', color: '#20B2AA' },
  { id: 8, name: 'Prarie', color: '#FF8C00' },
  { id: 9, name: 'Zach', color: '#00CED1' },
  { id: 10, name: 'Ambree', color: '#FF69B4' },
  { id: 11, name: 'Smathers', color: '#40E0D0' },
  { id: 12, name: 'Seth J.', color: '#9932CC' },
  { id: 13, name: 'Andrew Jarrett', color: '#FFA07A' },
  { id: 14, name: 'Jonathan J.', color: '#5F9EA0' },
  { id: 15, name: 'Donna Rolt', color: '#DAA520' },
  { id: 16, name: 'Troy', color: '#6A5ACD' }
];

// Mock data for win percentage visualization
const mockWinPercentageData = [
  {
    week: 'Week of Apr 20',
    'Lance': 45,
    'Nate': 25,
    'Shortt': 47,
    'Vamsi': 43,
    'Keith': 42,
    'Relly': 48,
    'Trevor': 47,
    'Prarie': 44,
    'Zach': 39,
    'Ambree': 5,
    'Smathers': 41,
    'Seth J.': 44,
    'Andrew Jarrett': 46,
    'Jonathan J.': 42,
    'Donna Rolt': 43,
    'Troy': 57
  },
  {
    week: 'Week of Apr 27',
    'Lance': 44,
    'Nate': 49,
    'Shortt': 45,
    'Vamsi': 42,
    'Keith': 41,
    'Relly': 46,
    'Trevor': 45,
    'Prarie': 42,
    'Zach': 40,
    'Ambree': 39,
    'Smathers': 40,
    'Seth J.': 45,
    'Andrew Jarrett': 48,
    'Jonathan J.': 41,
    'Donna Rolt': 42,
    'Troy': 56
  },
  {
    week: 'Week of May 4',
    'Lance': 45,
    'Nate': 56,
    'Shortt': 45,
    'Vamsi': 42,
    'Keith': 43,
    'Relly': 47,
    'Trevor': 48,
    'Prarie': 43,
    'Zach': 40,
    'Ambree': 39,
    'Smathers': 42,
    'Seth J.': 44,
    'Andrew Jarrett': 47,
    'Jonathan J.': 42,
    'Donna Rolt': 44,
    'Troy': 57
  },
  {
    week: 'Week of May 11',
    'Lance': 45,
    'Nate': 57,
    'Shortt': 45,
    'Vamsi': 42,
    'Keith': 41,
    'Relly': 48,
    'Trevor': 50,
    'Prarie': 44,
    'Zach': 39,
    'Ambree': 39,
    'Smathers': 44,
    'Seth J.': 45,
    'Andrew Jarrett': 48,
    'Jonathan J.': 42,
    'Donna Rolt': 46,
    'Troy': 55
  }
];

// Mock data for total games
const mockTotalGamesData = [
  {
    week: 'Week of Apr 20',
    'Lance': 15,
    'Nate': 32,
    'Shortt': 22,
    'Vamsi': 14,
    'Keith': 18,
    'Relly': 10,
    'Trevor': 16,
    'Prarie': 12,
    'Zach': 11,
    'Ambree': 2,
    'Smathers': 13,
    'Seth J.': 14,
    'Andrew Jarrett': 12,
    'Jonathan J.': 10,
    'Donna Rolt': 13,
    'Troy': 1
  },
  {
    week: 'Week of Apr 27',
    'Lance': 28,
    'Nate': 55,
    'Shortt': 42,
    'Vamsi': 27,
    'Keith': 25,
    'Relly': 17,
    'Trevor': 26,
    'Prarie': 21,
    'Zach': 18,
    'Ambree': 5,
    'Smathers': 23,
    'Seth J.': 22,
    'Andrew Jarrett': 24,
    'Jonathan J.': 19,
    'Donna Rolt': 20,
    'Troy': 2
  },
  {
    week: 'Week of May 4',
    'Lance': 45,
    'Nate': 82,
    'Shortt': 75,
    'Vamsi': 42,
    'Keith': 35,
    'Relly': 24,
    'Trevor': 38,
    'Prarie': 30,
    'Zach': 25,
    'Ambree': 7,
    'Smathers': 34,
    'Seth J.': 32,
    'Andrew Jarrett': 35,
    'Jonathan J.': 30,
    'Donna Rolt': 32,
    'Troy': 3
  },
  {
    week: 'Week of May 11',
    'Lance': 72,
    'Nate': 117,
    'Shortt': 127,
    'Vamsi': 62,
    'Keith': 43,
    'Relly': 27,
    'Trevor': 48,
    'Prarie': 36,
    'Zach': 31,
    'Ambree': 8,
    'Smathers': 42,
    'Seth J.': 40,
    'Andrew Jarrett': 48,
    'Jonathan J.': 41,
    'Donna Rolt': 46,
    'Troy': 3
  }
];

// Filter to specific recent data points for "Recent" mode
const getRecentData = (data: any[]) => {
  // Get just the last two data points
  return data.slice(2);
};

type ChartMetric = 'winPercentage' | 'totalGames';
type TimeRange = 'recent' | 'allData';

interface WinPercentageChartProps {
  metricType?: ChartMetric;
  timeRange?: TimeRange;
}

export function WinPercentageChart({ 
  metricType = 'winPercentage', 
  timeRange = 'recent' 
}: WinPercentageChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<ChartMetric>(metricType);
  const [chartTimeRange, setChartTimeRange] = useState<TimeRange>(timeRange);

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    setPlayers(mockPlayers);
    updateChartData();
    setLoading(false);
  }, [chartMetric, chartTimeRange]);

  const updateChartData = () => {
    let sourceData = chartMetric === 'winPercentage' 
      ? mockWinPercentageData 
      : mockTotalGamesData;
    
    if (chartTimeRange === 'recent') {
      sourceData = getRecentData(sourceData);
    }
    
    setData(sourceData);
  };

  // Dashboard page will handle these buttons, but we export the handlers
  const handleMetricChange = (metric: ChartMetric) => {
    setChartMetric(metric);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setChartTimeRange(range);
  };

  if (loading) {
    return <div className="flex justify-center py-10">Loading chart data...</div>;
  }

  return (
    <>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis 
              domain={chartMetric === 'winPercentage' ? [0, 100] : ['auto', 'auto']} 
              tickFormatter={chartMetric === 'winPercentage' ? (value) => `${value}%` : undefined} 
            />
            <Tooltip 
              formatter={chartMetric === 'winPercentage' 
                ? (value: any) => [`${value}%`, ''] 
                : (value: any) => [value, '']} 
            />
            <Legend />
            {players.map((player) => (
              <Line
                key={player.id}
                type="monotone"
                dataKey={player.name}
                stroke={player.color}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}