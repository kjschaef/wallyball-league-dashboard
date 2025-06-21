'use client';

import { useState } from 'react';
import { PerformanceTrend } from './components/PerformanceTrend';
import { WinPercentageRankings } from './components/WinPercentageRankings';
import { RecentMatches } from './components/RecentMatches';
import { RecordMatchModal } from './components/RecordMatchModal';
import { ChatBot } from './components/ChatBot';

interface MatchData {
  teamOnePlayers: number[];
  teamTwoPlayers: number[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
  date: string;
}

interface PlayerData {
  name: string;
  startYear: number | null;
}

export default function DashboardPage() {
  const [showRecordMatchModal, setShowRecordMatchModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false); // Added state for Add Player modal

  const handleRecordMatch = async (matchData: MatchData) => {
    try {
      // Transform the array-based data to the API's expected format
      const apiPayload = {
        teamOnePlayerOneId: matchData.teamOnePlayers[0] || null,
        teamOnePlayerTwoId: matchData.teamOnePlayers[1] || null,
        teamOnePlayerThreeId: matchData.teamOnePlayers[2] || null,
        teamTwoPlayerOneId: matchData.teamTwoPlayers[0] || null,
        teamTwoPlayerTwoId: matchData.teamTwoPlayers[1] || null,
        teamTwoPlayerThreeId: matchData.teamTwoPlayers[2] || null,
        teamOneGamesWon: matchData.teamOneGamesWon,
        teamTwoGamesWon: matchData.teamTwoGamesWon,
        date: matchData.date
      };

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record match');
      }

      const newMatch = await response.json();
      console.log('Match recorded:', newMatch);
      setShowRecordMatchModal(false);
      
      // Show success message
      alert('Match recorded successfully!');
    } catch (error) {
      console.error('Error recording match:', error);
      alert(`Failed to record match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddPlayer = () => {
    setShowAddPlayerModal(true); // Show the Add Player modal
  };

  const FloatingActionButton = ({ onRecordMatch, onAddPlayer }: { onRecordMatch: () => void; onAddPlayer: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
      setIsOpen(!isOpen);
    };

    return (
      <div className="fixed bottom-6 right-6">
        <div className="relative">
          {isOpen && (
            <div className="absolute bottom-16 right-0 bg-white rounded-md shadow-xl overflow-hidden z-10 min-w-48">
              <button
                onClick={() => {
                  onAddPlayer();
                  setIsOpen(false);
                }}
                className="block px-4 py-2 text-gray-800 hover:bg-gray-200 w-full text-left"
              >
                Add Player
              </button>
              <button
                onClick={() => {
                  onRecordMatch();
                  setIsOpen(false);
                }}
                className="block px-4 py-2 text-gray-800 hover:bg-gray-200 w-full text-left"
              >
                Record Match
              </button>
            </div>
          )}
          <button
            onClick={toggleOpen}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full shadow-lg transition-colors"
            style={{ width: '60px', height: '60px', fontSize: '24px', lineHeight: '1' }}
          >
            +
          </button>
        </div>
      </div>
    );
  };



  // Add Player Modal Component
  const AddPlayerModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: PlayerData) => Promise<void> }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const startYear = formData.get('startYear') as string;
      
      const playerData = {
        name: name,
        startYear: startYear ? parseInt(startYear) : null
      };
      
      try {
        await onSubmit(playerData);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Add New Player</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter player name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="startYear" className="block text-sm font-medium text-gray-700">Start Year (Optional)</label>
              <input
                id="startYear"
                name="startYear"
                type="number"
                min="1900"
                max="2100"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2024"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  const handleAddPlayerSubmit = async (playerData: PlayerData) => {
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });

      if (!response.ok) {
        throw new Error('Failed to add player');
      }

      const newPlayer = await response.json();
      console.log('Player added:', newPlayer);
      setShowAddPlayerModal(false);
      
      // Optionally show a success message
      alert(`Player "${playerData.name}" has been added successfully!`);
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Win Percentage</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <PerformanceTrend />
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

      <ChatBot />
    </div>
  );
}