'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, TrendingUp, Clock, Award } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  winPercentage: number;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  streak: {
    type: 'wins' | 'losses';
    count: number;
  };
  actualWinPercentage?: number;
  inactivityPenalty?: number;
}

interface TeamSuggestion {
  teamOne: Player[];
  teamTwo: Player[];
  balanceScore: number;
  expectedWinProbability: number;
  reasoning: string;
}

interface TeamSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTeams: (teamOne: number[], teamTwo: number[]) => void;
}

export function TeamSuggestionModal({ isOpen, onClose, onUseTeams }: TeamSuggestionModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [teamSuggestion, setTeamSuggestion] = useState<TeamSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'suggest'>('select');

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/player-stats');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const generateTeamSuggestion = async () => {
    if (selectedPlayers.length < 6) {
      alert('Please select at least 6 players for team suggestions.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Suggest balanced teams from these ${selectedPlayers.length} players`,
          context: {
            type: 'team_suggestion',
            players: selectedPlayers
          }
        })
      });

      const data = await response.json();
      if (data.additionalData) {
        setTeamSuggestion(data.additionalData);
        setStep('suggest');
      }
    } catch (error) {
      console.error('Failed to generate team suggestion:', error);
      alert('Failed to generate team suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTeams = () => {
    if (teamSuggestion) {
      const teamOneIds = teamSuggestion.teamOne.map(p => p.id);
      const teamTwoIds = teamSuggestion.teamTwo.map(p => p.id);
      onUseTeams(teamOneIds, teamTwoIds);
      onClose();
    }
  };

  const resetModal = () => {
    setSelectedPlayers([]);
    setTeamSuggestion(null);
    setStep('select');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getStreakColor = (streak: { type: 'wins' | 'losses'; count: number }) => {
    if (streak.type === 'wins') {
      return streak.count >= 3 ? 'text-green-600' : 'text-green-500';
    }
    return streak.count >= 3 ? 'text-red-600' : 'text-red-500';
  };

  const getWinPercentageColor = (percentage: number) => {
    if (percentage >= 50) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            AI Team Suggestions
          </DialogTitle>
        </DialogHeader>
        
        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Select the players who are available today. The AI will create balanced teams based on their performance statistics.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {players.map(player => (
                <div
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedPlayers.includes(player.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{player.name}</h3>
                    <div className={`text-sm font-medium ${getWinPercentageColor(player.winPercentage)}`}>
                      {player.winPercentage}%
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{player.record.wins}W - {player.record.losses}L</span>
                    <span className={getStreakColor(player.streak)}>
                      {player.streak.count} {player.streak.type}
                    </span>
                  </div>
                  
                  {player.inactivityPenalty && player.inactivityPenalty > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      -{player.inactivityPenalty}% inactivity
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Selected: {selectedPlayers.length} players
                {selectedPlayers.length >= 6 && (
                  <span className="text-green-600 ml-2">✓ Ready for team suggestions</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={generateTeamSuggestion}
                  disabled={selectedPlayers.length < 6 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Teams'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {step === 'suggest' && teamSuggestion && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">AI Suggested Teams</div>
              <div className="flex justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Balance Score: {teamSuggestion.balanceScore}/100
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Team 1 Win Probability: {teamSuggestion.expectedWinProbability}%
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-600">Team 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {teamSuggestion.teamOne.map(player => (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="font-medium">{player.name}</span>
                      <div className="text-sm text-gray-600">
                        {player.winPercentage}% • {player.streak.count} {player.streak.type}
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-gray-600 mt-2">
                    Avg Win %: {Math.round(teamSuggestion.teamOne.reduce((sum, p) => sum + p.winPercentage, 0) / teamSuggestion.teamOne.length)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-600">Team 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {teamSuggestion.teamTwo.map(player => (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="font-medium">{player.name}</span>
                      <div className="text-sm text-gray-600">
                        {player.winPercentage}% • {player.streak.count} {player.streak.type}
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-gray-600 mt-2">
                    Avg Win %: {Math.round(teamSuggestion.teamTwo.reduce((sum, p) => sum + p.winPercentage, 0) / teamSuggestion.teamTwo.length)}%
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">AI Analysis:</h4>
              <p className="text-sm text-gray-700">{teamSuggestion.reasoning}</p>
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back to Selection
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleUseTeams} className="bg-green-600 hover:bg-green-700">
                  Use These Teams
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}