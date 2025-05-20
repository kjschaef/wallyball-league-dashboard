'use client';

import { useState } from 'react';
import { WinPercentageChart } from '../components/WinPercentageChart';
import { WinPercentageRankings } from '../components/WinPercentageRankings';

export default function DashboardPage() {
  const [chartMetric, setChartMetric] = useState<'winPercentage' | 'totalGames'>('winPercentage');
  const [timeRange, setTimeRange] = useState<'recent' | 'allData'>('recent');

  const handleExportImage = () => {
    // In a real implementation, this would capture the dashboard as an image
    alert('Export functionality would capture the dashboard as an image');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Wallyball Dashboard</h1>
        <button 
          onClick={handleExportImage}
          className="text-sm text-gray-600 flex items-center hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
          </svg>
          <span>Share as Image</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-800">Win Percentage</h2>
          <div className="flex space-x-2">
            <button 
              className={`${chartMetric === 'winPercentage' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
              onClick={() => setChartMetric('winPercentage')}
            >
              Win %
            </button>
            <button 
              className={`${chartMetric === 'totalGames' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
              onClick={() => setChartMetric('totalGames')}
            >
              Total
            </button>
          </div>
        </div>
        
        <div className="mt-2 mb-4">
          <div className="flex space-x-2 justify-end">
            <button 
              className={`${timeRange === 'recent' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
              onClick={() => setTimeRange('recent')}
            >
              Recent
            </button>
            <button 
              className={`${timeRange === 'allData' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'} px-4 py-1 text-sm rounded transition duration-150 ease-in-out`}
              onClick={() => setTimeRange('allData')}
            >
              All Data
            </button>
          </div>
        </div>

        <WinPercentageChart metricType={chartMetric} timeRange={timeRange} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4 text-gray-800">Win Percentage Rankings</h2>
        <WinPercentageRankings />
      </div>
    </div>
  );
}