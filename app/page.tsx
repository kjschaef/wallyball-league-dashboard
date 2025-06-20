'use client';

import { useState } from 'react';
import { PerformanceTrend } from './components/PerformanceTrend';
import { WinPercentageRankings } from './components/WinPercentageRankings';
import { RecentMatches } from './components/RecentMatches';
import { RecordMatchModal } from './components/RecordMatchModal';

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
        <div className="cfa-card p-6 w-full max-w-md mx-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Player</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-1">Player Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="cfa-input"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label htmlFor="startYear" className="block text-sm font-semibold text-gray-900 mb-1">Start Year (Optional)</label>
              <input
                id="startYear"
                name="startYear"
                type="number"
                min="1900"
                max="2100"
                className="cfa-input"
                placeholder="e.g., 2024"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 cfa-button-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 cfa-button-primary disabled:opacity-50"
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
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-white py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Volleyball League Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Track performance and manage your volleyball league
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setShowRecordMatchModal(true)}
                className="cfa-button-primary"
              >
                Record Match
              </button>
              <button 
                onClick={() => setShowAddPlayerModal(true)}
                className="cfa-button-secondary"
              >
                Add Player
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Performance Trend Chart */}
              <div className="lg:col-span-2">
                <div className="cfa-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Win Percentage Trends</h3>
                  <PerformanceTrend />
                </div>
              </div>

              {/* Rankings */}
              <div>
                <div className="cfa-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Rankings</h3>
                  <WinPercentageRankings />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="cfa-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Matches</h3>
              <RecentMatches />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RecordMatchModal
        isOpen={showRecordMatchModal}
        onClose={() => setShowRecordMatchModal(false)}
        onSubmit={handleRecordMatch}
      />

      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onSubmit={handleAddPlayerSubmit}
      />
    </>
  );
}