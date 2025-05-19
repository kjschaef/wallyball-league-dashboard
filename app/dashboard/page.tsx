import { WinPercentageChart } from '../components/WinPercentageChart';
import { WinPercentageRankings } from '../components/WinPercentageRankings';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Wallyball Dashboard</h1>
        <button className="text-sm text-gray-600 flex items-center">
          <span>Share as Image</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Win Percentage</h2>
          <div className="flex space-x-2">
            <button className="bg-gray-900 text-white px-4 py-1 text-sm rounded">
              Win %
            </button>
            <button className="bg-white text-gray-700 px-4 py-1 text-sm rounded border">
              Total
            </button>
          </div>
        </div>
        
        <div className="mt-2 mb-4">
          <div className="flex space-x-2 justify-end">
            <button className="bg-gray-900 text-white px-4 py-1 text-sm rounded">
              Recent
            </button>
            <button className="bg-white text-gray-700 px-4 py-1 text-sm rounded border">
              All Data
            </button>
          </div>
        </div>

        <WinPercentageChart />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Win Percentage Rankings</h2>
        <WinPercentageRankings />
      </div>
    </div>
  );
}