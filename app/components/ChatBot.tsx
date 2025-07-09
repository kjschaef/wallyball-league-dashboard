'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send, Bot, User, Users, TrendingUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PlayerGrid } from './PlayerGrid';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: string;
  additionalData?: any;
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
  teamOne: Array<{ id: number; name: string; winPercentage: number }>;
  teamTwo: Array<{ id: number; name: string; winPercentage: number }>;
  balanceScore: number;
  expectedWinProbability: number;
  reasoning: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [pendingTeamSuggestionPrompt, setPendingTeamSuggestionPrompt] = useState<string>('');

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
  }, [isOpen]);

  const fetchChatStatus = async () => {
    try {
      const response = await fetch('/api/chatbot');
      const data = await response.json();
      setChatStatus(data);
      
      if (data.status === 'ready') {
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your volleyball team assistant. I have access to data for ${data.playerCount} players.\n\nI can help you with:\n• Player performance analysis\n• Team matchup suggestions\n• Match predictions\n• Statistical comparisons\n\nTry asking: "Who are the top players?" or "Suggest balanced teams"`,
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
    if (selectedPlayers.length < 6) {
      alert('Please select at least 6 players for team suggestions.');
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
        Streaks
      </Button>
    </div>
  );

  const TeamSuggestionCard = ({ data }: { data: TeamSuggestion }) => (
    <Card className="mt-2 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Team 1</h4>
            {data.teamOne.map(player => (
              <div key={player.id} className="text-sm">
                {player.name} ({player.winPercentage}%)
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Team 2</h4>
            {data.teamTwo.map(player => (
              <div key={player.id} className="text-sm">
                {player.name} ({player.winPercentage}%)
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-sm text-blue-700">
          <span>Balance: {data.balanceScore}/100</span>
          <span>Team 1 Win Chance: {data.expectedWinProbability}%</span>
        </div>
        <Button 
          className="w-full mt-3" 
          variant="outline"
          onClick={() => {
            // TODO: Integrate with match recording
            alert('Team suggestion will be integrated with match recording in the next phase!');
          }}
        >
          Use These Teams
        </Button>
      </CardContent>
    </Card>
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
                        <div className="text-sm prose prose-sm max-w-none prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-ul:text-inherit prose-ol:text-inherit prose-li:text-inherit">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      )}
                      {message.type === 'team_suggestion' && message.additionalData && (
                        <TeamSuggestionCard data={message.additionalData} />
                      )}
                    </div>
                  </div>
                  <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
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
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Player Selector Modal */}
    <Dialog open={showPlayerSelector} onOpenChange={setShowPlayerSelector}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Available Players
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            Select the players who are available today. The AI will create balanced teams from your selection.
          </div>
          
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Available Players</h3>
              <p className="text-sm text-gray-600">
                Select players ({selectedPlayers.length} selected)
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {allPlayers.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }
                    `}
                  >
                    {player.name}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Selected: {selectedPlayers.length} players
              {selectedPlayers.length >= 6 && (
                <span className="text-green-600 ml-2">✓ Ready for team suggestions</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelPlayerSelection}>
                Cancel
              </Button>
              <Button 
                onClick={generateTeamSuggestionWithPlayers}
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
      </DialogContent>
    </Dialog>
    </>
  );
}