import Link from 'next/link';

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Volleyball League Management</h1>
      <p className="mb-4">Welcome to your volleyball league management platform!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Performance Tracking</h2>
          <p>Track and analyze player and team performance data.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">League Management</h2>
          <p>Manage teams, players, and match schedules.</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Dashboard
        </Link>
        <Link href="/players" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Players
        </Link>
        <Link href="/results" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Results
        </Link>
        <Link href="/analytics" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Analytics
        </Link>
      </div>
    </div>
  );
}