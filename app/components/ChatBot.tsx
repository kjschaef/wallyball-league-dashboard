'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { MessageCircle, Send, Bot, User, Users, TrendingUp, Loader2, ThumbsUp, ThumbsDown, Gavel, Flame, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { PlayerSelectorDialog } from './PlayerSelectorDialog';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: string;
  additionalData?: TeamSuggestion | TeamSuggestion[] | MatchResult | MatchResult[] | MatchResultsResponse | TeamGrouping[];
  imagePreview?: string;
}

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
  scenario?: string;
  teamOne: Array<{ id: number; name: string; winPercentage: number }>;
  teamTwo: Array<{ id: number; name: string; winPercentage: number }>;
  balanceScore: number;
  expectedWinProbability: number;
  reasoning: string;
}

interface MatchResult {
  matchNumber: number;
  team1: {
    players: string[];
    wins: number;
  };
  team2: {
    players: string[];
    wins: number;
  };
}

interface TeamGrouping {
  players: string[];
  letters: string[];
  wins?: number;
  needsClarification?: boolean;
}

interface MatchResult {
  matchNumber: number;
  teamOne: TeamGrouping;
  teamTwo: TeamGrouping;
}

interface AmbiguousLetter {
  letter: string;
  possiblePlayers: string[];
}

interface MatchResultsResponse {
  hasAmbiguity: boolean;
  ambiguousLetters?: AmbiguousLetter[];
  matches: MatchResult[];
}

interface ChatBotProps {
  className?: string;
  onUseMatchup?: (teamOne: number[], teamTwo: number[]) => void;
  onRecordMatch?: (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => void;
}

function isMatchResult(data: any): data is MatchResult {
  return data && typeof data === 'object' && 'matchNumber' in data && 'team1' in data && 'team2' in data;
}

function isTeamSuggestion(data: any): data is TeamSuggestion {
  return data && typeof data === 'object' && 'teamOne' in data && 'teamTwo' in data;
}

function isTeamGrouping(data: any): data is TeamGrouping {
  return data && typeof data === 'object' && 'teamNumber' in data && 'players' in data && 'letters' in data;
}

export function ChatBot({ onUseMatchup, onRecordMatch }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<{ status: string; playerCount: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [pendingTeamSuggestionPrompt, setPendingTeamSuggestionPrompt] = useState<string>('');
  const [feedbackDialog, setFeedbackDialog] = useState<{
    isOpen: boolean;
    messageIndex: number;
    type: 'positive' | 'negative';
  }>({ isOpen: false, messageIndex: -1, type: 'positive' });
  const [feedbackText, setFeedbackText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playerChoices, setPlayerChoices] = useState<{ [key: string]: string }>({});
  const [lastUploadedImage, setLastUploadedImage] = useState<File | null>(null);

  const logMatch = async (result: MatchResult) => {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (response.ok) {
        alert(`Match ${result.matchNumber} has been logged successfully!`);
      } else {
        alert(`Failed to log match ${result.matchNumber}.`);
      }
    } catch (error) {
      console.error('Failed to log match:', error);
      alert(`Failed to log match ${result.matchNumber}.`);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected.');
      return;
    }
    console.log('File selected:', file.name);

    // Store the uploaded image for later use in disambiguation
    setLastUploadedImage(file);

    const reader = new FileReader();
    
    reader.onloadend = async () => {
      const imageDataUrl = reader.result as string;

      // Fetch current player names
      let playerNames: string[] = [];
      try {
        const playersResponse = await fetch('/api/players');
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          playerNames = playersData.map((player: any) => player.name);
        }
      } catch (error) {
        console.error('Failed to fetch player names:', error);
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('playerNames', JSON.stringify(playerNames));
      formData.append('step', '1'); // Start with step 1 for the new two-step process

      const userMessage: ChatMessage = {
        role: 'user',
        content: '',
        timestamp: new Date().toISOString(),
        imagePreview: imageDataUrl,
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        console.log('Uploading image with player names...');
        const response = await fetch('/api/chatbot/image', {
          method: 'POST',
          body: formData,
        });

        console.log('Image upload response:', response);
        const data = await response.json();
        console.log('Image upload data:', data);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
          type: data.type,
          additionalData: data.additionalData
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Failed to upload image:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your image. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'error'
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !chatStatus) {
      fetchChatStatus();
      fetchPlayers();
    }
  }, [isOpen, chatStatus]);

  const fetchChatStatus = async () => {
    try {
      const response = await fetch('/api/chatbot');
      const data = await response.json();
      setChatStatus(data);

      if (data.status === 'ready') {
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your volleyball team assistant. I have access to data for ${data.playerCount} players and the official wallyball rulebook.\n\nI can help you with:\n• Player performance analysis\n• Team matchup suggestions\n• Answering questions about wallyball rules\n\nFor example, try asking:\n• "Who are the top players?"\n• "Suggest balanced teams for today"\n• "Is the backwall allowed in regular play?"\n• "Is it legal to touch the net?"`,
          timestamp: new Date().toISOString(),
          type: 'welcome'
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch chat status:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/player-stats');
      const data = await response.json();
      setAllPlayers(data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check if this is a team suggestion request
    if (isTeamSuggestionRequest(input)) {
      setPendingTeamSuggestionPrompt(input);
      setShowPlayerSelector(true);
      setInput('');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        type: data.type,
        additionalData: data.additionalData
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const generateTeamSuggestionWithPlayers = async () => {
    if (selectedPlayers.length < 4) {
      alert('Please select at least 4 players for team suggestions.');
      return;
    }

    setShowPlayerSelector(false);
    setIsLoading(true);

    const selectedPlayerNames = allPlayers
      .filter(p => selectedPlayers.includes(p.id))
      .map(p => p.name);

    const enhancedPrompt = `${pendingTeamSuggestionPrompt} from these available players: ${selectedPlayerNames.join(', ')}`;

    const userMessage: ChatMessage = {
      role: 'user',
      content: enhancedPrompt,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enhancedPrompt,
          context: {
            type: 'team_suggestion',
            players: selectedPlayers
          }
        })
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        type: data.type,
        additionalData: data.additionalData
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
      setSelectedPlayers([]);
      setPendingTeamSuggestionPrompt('');
    }
  };

  const cancelPlayerSelection = () => {
    setShowPlayerSelector(false);
    setSelectedPlayers([]);
    setPendingTeamSuggestionPrompt('');
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIndex: feedbackDialog.messageIndex,
          feedbackType: feedbackDialog.type,
          feedbackText,
          chatTranscript: messages
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Thank you for your feedback!');
      } else {
        console.error('Feedback submission failed:', result);
        alert(`Failed to submit feedback: ${result.error || 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback due to network error. Please try again.');
    }

    setFeedbackDialog({ isOpen: false, messageIndex: -1, type: 'positive' });
    setFeedbackText('');
  };

  const openFeedbackDialog = (messageIndex: number, type: 'positive' | 'negative') => {
    setFeedbackDialog({ isOpen: true, messageIndex, type });
  };

  const isTeamSuggestionRequest = (prompt: string): boolean => {
    const teamKeywords = ['team', 'suggest', 'balance', 'matchup', 'formation'];
    const lowerPrompt = prompt.toLowerCase();
    return teamKeywords.some(keyword => lowerPrompt.includes(keyword));
  };

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return;

    // Check if this is a team suggestion request
    if (isTeamSuggestionRequest(prompt)) {
      setPendingTeamSuggestionPrompt(prompt);
      setShowPlayerSelector(true);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        type: data.type,
        additionalData: data.additionalData
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickActions = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction("Who are the top performing players?")}
        disabled={isLoading}
        className="text-xs"
      >
        <TrendingUp className="w-3 h-3 mr-1" />
        Top Players
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction("Suggest balanced teams for today")}
        disabled={isLoading}
        className="text-xs"
      >
        <Users className="w-3 h-3 mr-1" />
        Team Suggestions
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction("Which players are on winning streaks?")}
        disabled={isLoading}
        className="text-xs"
      >
        <Flame className="w-3 h-3 mr-1" />
        Streaks
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction("Is the backwall allowed in regular play?")}
        disabled={isLoading}
        className="text-xs"
      >
        <Gavel className="w-3 h-3 mr-1" />
        Wallyball Rules
      </Button>
    </div>
  );

  const TeamSuggestionCard = ({ data, index }: { data: TeamSuggestion; index: number }) => (
    <Card className="mt-2 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        {data.scenario && (
          <h4 className="font-semibold text-blue-900 mb-3 text-center">{data.scenario}</h4>
        )}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <h5 className="font-semibold text-blue-900 mb-2">Team 1</h5>
            {data.teamOne.map(player => (
              <div key={player.id} className="text-sm">
                {player.name} ({player.winPercentage.toFixed(1)}%)
              </div>
            ))}
          </div>
          <div>
            <h5 className="font-semibold text-blue-900 mb-2">Team 2</h5>
            {data.teamTwo.map(player => (
              <div key={player.id} className="text-sm">
                {player.name} ({player.winPercentage.toFixed(1)}%)
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-sm text-blue-700 mb-2">
          <span>Balance: {data.balanceScore}/100</span>
          <span>Team 1 Win Chance: {data.expectedWinProbability}%</span>
        </div>
        <div className="text-xs text-blue-600 mb-3 italic">
          {data.reasoning}
        </div>
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => {
            if (onUseMatchup) {
              const teamOneIds = data.teamOne.map(player => player.id);
              const teamTwoIds = data.teamTwo.map(player => player.id);
              setIsOpen(false); // Close the chatbot dialog
              onUseMatchup(teamOneIds, teamTwoIds);
            } else {
              // TODO: Integrate with match recording
              alert(`Team matchup ${index + 1} will be integrated with match recording in the next phase!`);
            }
          }}
        >
          Use This Matchup
        </Button>
      </CardContent>
    </Card>
  );

  const MultipleTeamSuggestions = ({ suggestions }: { suggestions: TeamSuggestion[] }) => (
    <div className="space-y-4 mt-2">
      {suggestions.map((suggestion, index) => (
        <TeamSuggestionCard key={index} data={suggestion} index={index} />
      ))}
    </div>
  );

  const MatchResultsCard = ({ result }: { result: MatchResult }) => (
    <Card className="mt-2 bg-green-50 border-green-200">
      <CardContent className="p-4">
        <h4 className="font-semibold text-green-900 mb-3 text-center">Match {result.matchNumber}</h4>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <h5 className="font-semibold text-green-900 mb-2">Team 1</h5>
            <p className="text-sm">{result.team1.players.join(', ')}</p>
            <p className="text-sm">Wins: {result.team1.wins}</p>
          </div>
          <div>
            <h5 className="font-semibold text-green-900 mb-2">Team 2</h5>
            <p className="text-sm">{result.team2.players.join(', ')}</p>
            <p className="text-sm">Wins: {result.team2.wins}</p>
          </div>
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => logMatch(result)}
        >
          Log Match
        </Button>
      </CardContent>
    </Card>
  );

  const MatchResultCard = ({ match }: { match: MatchResult }) => {
    const hasAmbiguity = match.teamOne.needsClarification || match.teamTwo.needsClarification;
    const cardColor = hasAmbiguity ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200';
    const textColor = hasAmbiguity ? 'text-orange-900' : 'text-purple-900';
    const lightTextColor = hasAmbiguity ? 'text-orange-700' : 'text-purple-700';
    const mediumTextColor = hasAmbiguity ? 'text-orange-800' : 'text-purple-800';

    const handleRecordMatch = () => {
      if (!onRecordMatch || hasAmbiguity) return;

      // Map player names to IDs
      const getPlayerIds = (playerNames: string[]): number[] => {
        return playerNames
          .map(name => allPlayers.find(p => p.name === name)?.id)
          .filter((id): id is number => id !== undefined);
      };

      const teamOneIds = getPlayerIds(match.teamOne.players);
      const teamTwoIds = getPlayerIds(match.teamTwo.players);

      // Only proceed if we found all player IDs
      if (teamOneIds.length === match.teamOne.players.length && 
          teamTwoIds.length === match.teamTwo.players.length) {
        setIsOpen(false); // Close chatbot dialog
        onRecordMatch(teamOneIds, teamTwoIds, match.teamOne.wins || 0, match.teamTwo.wins || 0);
      } else {
        alert('Could not find all players in the roster. Please make sure all players are added to the system.');
      }
    };

    return (
      <Card className={`mt-2 ${cardColor}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-semibold ${textColor}`}>
              Match {match.matchNumber} {hasAmbiguity && '(Needs Clarification)'}
            </h4>
            <div className={`text-lg font-bold ${textColor}`}>
              {match.teamOne.wins || 0} - {match.teamTwo.wins || 0}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h5 className={`font-medium ${mediumTextColor}`}>Team One</h5>
              <p className={`text-sm ${mediumTextColor}`}>
                Letters: {match.teamOne.letters.join(', ')}
              </p>
              <p className={`text-sm ${lightTextColor}`}>
                {match.teamOne.players.join(', ')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className={`font-medium ${mediumTextColor}`}>Team Two</h5>
              <p className={`text-sm ${mediumTextColor}`}>
                Letters: {match.teamTwo.letters.join(', ')}
              </p>
              <p className={`text-sm ${lightTextColor}`}>
                {match.teamTwo.players.join(', ')}
              </p>
            </div>
          </div>

          {!hasAmbiguity && onRecordMatch && (
            <Button 
              onClick={handleRecordMatch}
              className="w-full"
              variant="outline"
            >
              Record This Match
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };


  const PlayerDisambiguationCard = ({ response, originalImage }: { response: MatchResultsResponse, originalImage?: File }) => {
    const handlePlayerChoice = (letter: string, player: string) => {
      setPlayerChoices(prev => ({ ...prev, [letter]: player }));
    };

    const allChoicesMade = response.ambiguousLetters?.every(amb => {
      return playerChoices[amb.letter];
    }) || false;

    const finalizeClarification = async () => {
      if (!response.ambiguousLetters || !allChoicesMade) return;

      // Check if this is step 1 (no matches) or the old format (has matches)
      if (response.matches && response.matches.length > 0) {
        // Old format - update matches with user choices
        const finalizedMatches = response.matches.map(match => {
          const updateTeam = (team: TeamGrouping) => {
            const updatedPlayers = team.players.map(player => {
              if (player.startsWith('?')) {
                const letter = player.substring(1);
                return playerChoices[letter] || player;
              }
              return player;
            });
            
            return {
              ...team,
              players: updatedPlayers,
              needsClarification: false
            };
          };

          return {
            ...match,
            teamOne: updateTeam(match.teamOne),
            teamTwo: updateTeam(match.teamTwo)
          };
        });

        // Create a new message with finalized matches
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: 'Great! Here are the finalized match results:',
          timestamp: new Date().toISOString(),
          type: 'match_results',
          additionalData: { matches: finalizedMatches, hasAmbiguity: false }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // New two-step format - proceed to step 2 with confirmed players
        if (!originalImage) return;
        
        try {
          setIsLoading(true);
          
          // Create final player list from choices
          const confirmedPlayers = Object.values(playerChoices);
          
          // Send to step 2 with confirmed players
          const formData = new FormData();
          formData.append('image', originalImage);
          formData.append('confirmedPlayers', JSON.stringify(confirmedPlayers));
          formData.append('step', '2');

          const response = await fetch('/api/chatbot/image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
            type: result.type,
            additionalData: result.additionalData
          };

          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          console.error('Error in step 2:', error);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your confirmed player choices. Please try again.',
            timestamp: new Date().toISOString(),
            type: 'error'
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      }
      setPlayerChoices({});
    };

    return (
      <Card className="mt-2 bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-yellow-900 mb-3 text-center">Player Clarification Needed</h4>
          <p className="text-sm text-yellow-800 mb-4">
            Some letters could match multiple players. Please choose which player each letter represents (choice will apply to all instances):
          </p>
          
          <div className="space-y-4">
            {response.ambiguousLetters?.map((amb, index) => {
              // Count how many times this letter appears across all matches
              const letterCount = response.matches.reduce((count, match) => {
                const teamOneCount = match.teamOne.letters.filter(l => l === amb.letter).length;
                const teamTwoCount = match.teamTwo.letters.filter(l => l === amb.letter).length;
                return count + teamOneCount + teamTwoCount;
              }, 0);
              
              return (
                <div key={index} className="border border-yellow-300 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    Letter &quot;{amb.letter}&quot; ({letterCount} instance{letterCount !== 1 ? 's' : ''}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {amb.possiblePlayers.map(player => {
                      const isSelected = playerChoices[amb.letter] === player;
                      return (
                        <button
                          key={player}
                          onClick={() => handlePlayerChoice(amb.letter, player)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            isSelected 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          {player}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {allChoicesMade && (
            <Button 
              onClick={finalizeClarification}
              className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700"
            >
              Confirm Player Choices
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const TeamGroupingCard = ({ grouping }: { grouping: TeamGrouping }) => (
    <Card className={`mt-2 ${grouping.needsClarification ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-semibold ${grouping.needsClarification ? 'text-orange-900' : 'text-purple-900'}`}>
            Team {grouping.needsClarification && '(Needs Clarification)'}
          </h4>
          {grouping.wins !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              grouping.needsClarification ? 'bg-orange-200 text-orange-800' : 'bg-purple-200 text-purple-800'
            }`}>
              <span>{grouping.wins} win{grouping.wins !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <p className={`text-sm font-medium ${grouping.needsClarification ? 'text-orange-800' : 'text-purple-800'}`}>
              Letters seen: {grouping.letters.join(', ')}
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${grouping.needsClarification ? 'text-orange-800' : 'text-purple-800'}`}>Players:</p>
            <p className={`text-sm ${grouping.needsClarification ? 'text-orange-700' : 'text-purple-700'}`}>
              {grouping.players.join(', ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MultipleTeamGroupings = ({ groupings }: { groupings: TeamGrouping[] }) => (
    <div className="space-y-2 mt-2">
      {groupings.map((grouping, index) => (
        <TeamGroupingCard key={index} grouping={grouping} />
      ))}
    </div>
  );

  const MultipleMatchResults = ({ matches }: { matches: MatchResult[] }) => (
    <div className="space-y-2 mt-2">
      {matches.map((match, index) => (
        <MatchResultCard key={index} match={match} />
      ))}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-6 right-28 h-14 w-14 rounded-full shadow-lg z-50 bg-gray-900 hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Volleyball Team Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Chat is loading...</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      {message.role === 'assistant' ? (
                        // For team suggestions, only show cards, not the text
                        message.type === 'team_suggestion' ? null : (
                          <div className="text-sm prose prose-sm max-w-none prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-ul:text-inherit prose-ol:text-inherit prose-li:text-inherit">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      )}
                      {message.imagePreview && (
                        <div className="mt-2">
                          <img src={message.imagePreview} alt="Uploaded preview" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
                        </div>
                      )}
                      {message.type === 'team_suggestion' && message.additionalData && (
                        Array.isArray(message.additionalData) && message.additionalData.every(isTeamSuggestion) ? (
                          <MultipleTeamSuggestions suggestions={message.additionalData} />
                        ) : (
                          isTeamSuggestion(message.additionalData) && <TeamSuggestionCard data={message.additionalData} index={0} />
                        )
                      )}
                      {message.type === 'match_results' && message.additionalData && (
                        Array.isArray(message.additionalData) ? (
                          message.additionalData.map((result, index) => (
                            isMatchResult(result) && <MatchResultsCard key={index} result={result} />
                          ))
                        ) : (
                          isMatchResult(message.additionalData) && <MatchResultsCard result={message.additionalData} />
                        )
                      )}
                      {message.type === 'player_disambiguation' && message.additionalData && (
                        (() => {
                          const data = message.additionalData as any;
                          if (data.ambiguousLetters && data.ambiguousLetters.length > 0) {
                            // Convert the step 1 format to match the existing PlayerDisambiguationCard format
                            const mockResponse = {
                              hasAmbiguity: true,
                              ambiguousLetters: data.ambiguousLetters,
                              matches: [] // Empty matches since we're in step 1
                            };
                            return <PlayerDisambiguationCard response={mockResponse as MatchResultsResponse} originalImage={lastUploadedImage || undefined} />;
                          }
                          return null;
                        })()
                      )}
                      {(message.type === 'team_groupings' || message.type === 'match_results') && message.additionalData && (
                        (() => {
                          const data = message.additionalData as any;
                          // Handle new format with hasAmbiguity flag
                          if (data.hasAmbiguity && data.ambiguousLetters) {
                            return <PlayerDisambiguationCard response={data as MatchResultsResponse} originalImage={lastUploadedImage || undefined} />;
                          }
                          // Handle matches array
                          else if (data.matches) {
                            return <MultipleMatchResults matches={data.matches} />;
                          }
                          // Handle legacy teams array format for backwards compatibility
                          else if (data.teams) {
                            return <MultipleTeamGroupings groupings={data.teams} />;
                          }
                          // Handle legacy array format
                          else if (Array.isArray(message.additionalData)) {
                            return <MultipleTeamGroupings groupings={message.additionalData.filter(isTeamGrouping) as TeamGrouping[]} />;
                          }
                          // Handle single team grouping
                          else if (isTeamGrouping(message.additionalData)) {
                            return <TeamGroupingCard grouping={message.additionalData as TeamGrouping} />;
                          }
                          return null;
                        })()
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    {message.role === 'assistant' && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openFeedbackDialog(index, 'positive')}
                          className="h-6 w-6 p-0 hover:bg-green-100"
                        >
                          <ThumbsUp className="h-3 w-3 text-gray-400 hover:text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openFeedbackDialog(index, 'negative')}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <ThumbsDown className="h-3 w-3 text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4">
            {messages.length > 0 && <QuickActions />}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about player performance or team suggestions..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <PlayerSelectorDialog
      isOpen={showPlayerSelector}
      onOpenChange={setShowPlayerSelector}
      allPlayers={allPlayers}
      selectedPlayers={selectedPlayers}
      onTogglePlayer={togglePlayer}
      onCancel={cancelPlayerSelection}
      onGenerateTeams={generateTeamSuggestionWithPlayers}
      isLoading={isLoading}
    />

    {/* Feedback Dialog */}
    <Dialog open={feedbackDialog.isOpen} onOpenChange={(open) => {
      if (!open) {
        setFeedbackDialog({ isOpen: false, messageIndex: -1, type: 'positive' });
        setFeedbackText('');
      }
    }}>
      <DialogContent className="max-w-md" aria-describedby="feedback-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {feedbackDialog.type === 'positive' ? (
              <ThumbsUp className="h-5 w-5 text-green-600" />
            ) : (
              <ThumbsDown className="h-5 w-5 text-red-600" />
            )}
            {feedbackDialog.type === 'positive' ? 'Positive Feedback' : 'Feedback for Improvement'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div id="feedback-description" className="text-sm text-gray-600">
            {feedbackDialog.type === 'positive' 
              ? "What did you like about this response?"
              : "How can we improve this response?"
            }
          </div>

          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-[100px]"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackDialog({ isOpen: false, messageIndex: -1, type: 'positive' });
                setFeedbackText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitFeedback}
              disabled={!feedbackText.trim()}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}