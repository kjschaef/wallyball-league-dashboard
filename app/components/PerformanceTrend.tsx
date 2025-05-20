'use client';

import { useState, useEffect } from 'react';
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

// Mock data for visualization purposes
const mockPerformanceData = [
  { date: '2023-01-01', winRate: 40 },
  { date: '2023-01-15', winRate: 45 },
  { date: '2023-02-01', winRate: 52 },
  { date: '2023-02-15', winRate: 48 },
  { date: '2023-03-01', winRate: 55 },
  { date: '2023-03-15', winRate: 58 },
  { date: '2023-04-01', winRate: 60 },
  { date: '2023-04-15', winRate: 57 },
  { date: '2023-05-01', winRate: 62 }
];

interface PerformanceTrendProps {
  isExporting?: boolean;
}

export function PerformanceTrend({ isExporting = false }: PerformanceTrendProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real performance data from the original site
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch('https://cfa-wally-stats.replit.app/api/trends');
        if (!response.ok) {
          throw new Error('Failed to fetch performance data');
        }
        const data = await response.json();
        setData(formatData(data));
      } catch (error) {
        console.error('Error fetching performance data:', error);
        // As fallback, use pre-formatted mock data
        setData(formatData(mockPerformanceData));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, []);

  // Format dates to be more readable
  const formatData = (rawData: any[]) => {
    return rawData.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  };

  if (loading) {
    return <div className="flex justify-center py-10">Loading performance data...</div>;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
          <Legend />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="#4E4EFF"
            activeDot={{ r: 8 }}
            name="Win Rate"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}