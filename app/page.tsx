
'use client';

import { useState } from 'react';
import { PerformanceTrend } from './components/PerformanceTrend';
import { WinPercentageRankings } from './components/WinPercentageRankings';
import { RecentMatches } from './components/RecentMatches';

export default function DashboardPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = () => {
    setIsExporting(true);
    // In a real implementation, this would trigger image export
    setTimeout(() => {
      setIsExporting(false);
      alert('Export functionality would capture the dashboard as an image');
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Win Percentage</h1>
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

      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <PerformanceTrend isExporting={isExporting} />
          </div>
        </div>

        {/* Rankings */}
        <div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 h-full">
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                May 18, 2025
              </div>
              <div className="space-y-2">
                <WinPercentageRankings />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <RecentMatches />
      </div>
    </div>
  );
}
