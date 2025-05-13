import React from 'react';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Wallyball League Dashboard</h1>
      <nav className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6 mb-8">
        <a href="/" className="text-blue-600 hover:underline">Dashboard</a>
        <a href="/history" className="text-blue-600 hover:underline">Game History</a>
        <a href="/results" className="text-blue-600 hover:underline">Results</a>
        <a href="/analytics" className="text-blue-600 hover:underline">Player Analytics</a>
        <a href="/players" className="text-blue-600 hover:underline">Players</a>
      </nav>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Performance Trends</h2>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Recent Matches</h2>
          <p className="text-gray-600">Loading recent matches...</p>
        </div>
      </div>
    </main>
  );
}
