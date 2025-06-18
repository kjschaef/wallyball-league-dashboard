'use client';

import { useState } from 'react';
import { PerformanceTrend } from './components/PerformanceTrend';
import { WinPercentageRankings } from './components/WinPercentageRankings';
import { RecentMatches } from './components/RecentMatches';

export default function DashboardPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [showRecordMatchModal, setShowRecordMatchModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false); // Added state for Add Player modal

  const handleExportImage = () => {
    setIsExporting(true);
    // In a real implementation, this would trigger image export
    setTimeout(() => {
      setIsExporting(false);
      alert('Export functionality would capture the dashboard as an image');
    }, 500);
  };

  const handleRecordMatch = (matchData) => {
    // In a real implementation, this would handle recording the match
    console.log('Match recorded:', matchData);
    setShowRecordMatchModal(false);
  };

  const handleAddPlayer = () => {
    setShowAddPlayerModal(true); // Show the Add Player modal
  };

  const FloatingActionButton = ({ onRecordMatch, onAddPlayer }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
      setIsOpen(!isOpen);
    };

    return (
      <div className="relative">
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full shadow-lg"
          style={{ width: '60px', height: '60px', fontSize: '24px', lineHeight: '1' }} // Adjusted for circular shape
        >
          +
        </button>

        {isOpen && (
          <div className="absolute bottom-20 right-0 bg-white rounded-md shadow-xl overflow-hidden z-10">
            <button
              onClick={() => {
                onAddPlayer();
                setIsOpen(false);
              }}
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 w-48 text-left"
            >
              Add Player
            </button>
            <button
              onClick={() => {
                onRecordMatch();
                setIsOpen(false);
              }}
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 w-48 text-left"
            >
              Record Match
            </button>
          </div>
        )}
      </div>
    );
  };

  const RecordMatchModal = ({ isOpen, onClose, onSubmit }) => {
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');
    const [score1, setScore1] = useState('');
    const [score2, setScore2] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
      onSubmit({ player1, player2, score1, score2 });
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Record New Match</h3>
            <div className="mt-2 px-7 py-3">
              <input
                type="text"
                placeholder="Player 1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
              />
              <input
                type="text"
                placeholder="Player 2"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
              />
              <input
                type="number"
                placeholder="Score 1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
              />
              <input
                type="number"
                placeholder="Score 2"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
              />
            </div>
            <div className="items-center px-4 py-3">
              <button
                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                onClick={handleSubmit}
              >
                Record Match
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Player Modal Component
  const AddPlayerModal = ({ isOpen, onClose, onSubmit }) => {
    const [playerName, setPlayerName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
      onSubmit(playerName);
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Player</h3>
            <div className="mt-2 px-7 py-3">
              <input
                type="text"
                placeholder="Player Name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="items-center px-4 py-3">
              <button
                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                onClick={handleSubmit}
              >
                Add Player
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const handleAddPlayerSubmit = (playerName) => {
    // In a real implementation, this would handle adding the player
    console.log('Player added:', playerName);
    setShowAddPlayerModal(false);
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

      <FloatingActionButton 
          onRecordMatch={() => setShowRecordMatchModal(true)}
          onAddPlayer={handleAddPlayer}
        />

      <RecordMatchModal 
        isOpen={showRecordMatchModal}
        onClose={() => setShowRecordMatchModal(false)}
        onSubmit={handleRecordMatch}
      />

       <AddPlayerModal // Add the AddPlayerModal here
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onSubmit={handleAddPlayerSubmit}
      />
    </div>
  );
}