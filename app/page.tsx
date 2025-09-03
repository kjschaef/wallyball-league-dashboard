'use client';

import { useState, useEffect } from 'react';
import { PerformanceTrend } from './components/PerformanceTrend';
import { WinPercentageRankings } from './components/WinPercentageRankings';
import { RecentMatches } from './components/RecentMatches';
import { RecordMatchModal } from './components/RecordMatchModal';
import { ChatBot } from './components/ChatBot';
import { FloatingActionButton } from './components/FloatingActionButton';
import { PlayerSelectorDialog } from './components/PlayerSelectorDialog';
import { SeasonSelector } from './components/SeasonSelector';

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

interface Player {
  id: number;
  name: string;
}

interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const [showRecordMatchModal, setShowRecordMatchModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showPlayerSelectorDialog, setShowPlayerSelectorDialog] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Season management state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<string>('current'); // 'current', 'lifetime', or season ID
  
  const [suggestedTeams, setSuggestedTeams] = useState<{ teamOne: number[], teamTwo: number[] } | undefined>(undefined);
  const [prefilledWins, setPrefilledWins] = useState<{ teamOneWins: number, teamTwoWins: number } | undefined>(undefined);
  
  // Add refresh trigger for dashboard components
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        const data = await response.json();
        setAllPlayers(data);
      } catch (error) {
        console.error('Failed to fetch players:', error);
      }
    };
    
    const fetchSeasons = async () => {
      try {
        const response = await fetch('/api/seasons');
        const data = await response.json();
        setSeasons(data);
      } catch (error) {
        console.error('Failed to fetch seasons:', error);
      }
    };
    
    fetchPlayers();
    fetchSeasons();
  }, []);

  const handleRecordMatchSubmit = async (matchData: MatchData) => {
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
      setSuggestedTeams(undefined);
      setPrefilledWins(undefined);

      // Trigger refresh of all dashboard components
      setRefreshKey(prev => prev + 1);

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

  

  const handleUseTeams = (teamOne: number[], teamTwo: number[]) => {
    setSuggestedTeams({ teamOne, teamTwo });
    setShowRecordMatchModal(true);
  };

  const handleRecordMatch = (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => {
    setSuggestedTeams({ teamOne, teamTwo });
    // Store the wins for the modal to use
    setPrefilledWins({ teamOneWins, teamTwoWins });
    setShowRecordMatchModal(true);
  };

  const handleTogglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId) 
        : [...prev, playerId]
    );
  };

  const handleGenerateTeams = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `Create balanced team matchups for wallyball using players with IDs: ${selectedPlayers.join(', ')}. I need exactly ONE team suggestion with no duplicate players between teams. Each player should only appear on one team.`,
          context: {
            type: 'team_suggestion',
            players: selectedPlayers
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate teams');
      }

      const data = await response.json();
      
      // Extract the first matchup from additionalData
      if (data.additionalData && data.additionalData.length > 0) {
        const firstMatchup = data.additionalData[0];
        setSuggestedTeams({ 
          teamOne: firstMatchup.teamOne.map((player: any) => player.id),
          teamTwo: firstMatchup.teamTwo.map((player: any) => player.id)
        });
        setShowPlayerSelectorDialog(false);
        setShowRecordMatchModal(true);
      } else {
        throw new Error('No team suggestions received');
      }
    } catch (error) {
      console.error('Error generating teams:', error);
      alert('Failed to generate teams. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

      <SeasonSelector
        seasons={seasons}
        currentSeason={currentSeason}
        onSeasonChange={setCurrentSeason}
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <PerformanceTrend key={`trend-${refreshKey}`} season={currentSeason} />
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
                <WinPercentageRankings key={`rankings-${refreshKey}`} season={currentSeason} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <RecentMatches key={`recent-${refreshKey}`} />
      </div>

      <FloatingActionButton 
        onRecordMatch={() => setShowRecordMatchModal(true)}
        onAddPlayer={handleAddPlayer}
        onTeamSuggestionClick={() => setShowPlayerSelectorDialog(true)}
      />

      <RecordMatchModal 
        isOpen={showRecordMatchModal}
        onClose={() => {
          setShowRecordMatchModal(false);
          setSuggestedTeams(undefined);
          setPrefilledWins(undefined);
        }}
        onSubmit={handleRecordMatchSubmit}
        suggestedTeams={suggestedTeams}
        prefilledWins={prefilledWins}
      />

       <AddPlayerModal // Add the AddPlayerModal here
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onSubmit={handleAddPlayerSubmit}
      />

      <PlayerSelectorDialog
        isOpen={showPlayerSelectorDialog}
        onOpenChange={setShowPlayerSelectorDialog}
        allPlayers={allPlayers}
        selectedPlayers={selectedPlayers}
        onTogglePlayer={handleTogglePlayer}
        onCancel={() => setShowPlayerSelectorDialog(false)}
        onGenerateTeams={handleGenerateTeams}
        isLoading={isLoading}
      />

      <ChatBot className="w-full" onUseMatchup={handleUseTeams} onRecordMatch={handleRecordMatch} />
    </div>
  );
}
