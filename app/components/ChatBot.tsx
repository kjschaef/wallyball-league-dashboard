'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MessageCircle, Send, Bot, Upload } from 'lucide-react';
import { PlayerSelectorDialog } from './PlayerSelectorDialog';
import { MatchResult } from '../lib/types';
import { useAdmin } from './AdminProvider';
import { ChatMessage, ChatPlayer } from './chatbot/ChatBotCards';
import { ChatBotMessageList, ChatBotQuickActions, ChatBotFeedbackDialog } from './chatbot/ChatBotMessageList';
import {
  prepareWhiteboardPhoto,
  uploadWhiteboardPhoto,
  uploadLegacyMatchImage,
} from './chatbot/whiteboardUpload';

interface ChatBotProps {
  className?: string;
  onUseMatchup?: (teamOne: number[], teamTwo: number[]) => void;
  onRecordMatch?: (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMessage?: string;
}

export function ChatBot({
  onUseMatchup,
  onRecordMatch,
  isOpen: controlledIsOpen,
  onOpenChange: setControlledIsOpen,
  initialMessage,
}: ChatBotProps) {
  const { isAdmin, login } = useAdmin();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = setControlledIsOpen ?? setInternalIsOpen;

  const [defaultMessages, setDefaultMessages] = useState<ChatMessage[]>([]);
  const [reportMessages, setReportMessages] = useState<ChatMessage[]>([]);

  const isReportMode = !!initialMessage;
  const messages = isReportMode ? reportMessages : defaultMessages;
  const setMessages = isReportMode ? setReportMessages : setDefaultMessages;
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<{ status: string; playerCount: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [allPlayers, setAllPlayers] = useState<ChatPlayer[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [pendingTeamSuggestionPrompt, setPendingTeamSuggestionPrompt] = useState<string>('');
  const [feedbackDialog, setFeedbackDialog] = useState<{
    isOpen: boolean;
    messageIndex: number;
    type: 'positive' | 'negative';
  }>({ isOpen: false, messageIndex: -1, type: 'positive' });
  const [feedbackText, setFeedbackText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whiteboardInputRef = useRef<HTMLInputElement>(null);
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
    event.target.value = '';
    if (!file) return;

    setLastUploadedImage(file);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const imageDataUrl = reader.result as string;
      const userMessage: ChatMessage = {
        role: 'user',
        content: '',
        timestamp: new Date().toISOString(),
        imagePreview: imageDataUrl,
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const assistantMessage = await uploadLegacyMatchImage(file);
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Failed to upload image:', error);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your image. Please try again.',
            timestamp: new Date().toISOString(),
            type: 'error',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleWhiteboardUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLastUploadedImage(file);
    setIsLoading(true);

    try {
      const { uploadFile, previewUrl } = await prepareWhiteboardPhoto(file);

      const userMessage: ChatMessage = {
        role: 'user',
        content: "Here is a photo of today's whiteboard — please log these matches.",
        timestamp: new Date().toISOString(),
        imagePreview: previewUrl,
      };

      setMessages(prev => [...prev, userMessage]);

      const data = await uploadWhiteboardPhoto(uploadFile, allPlayers);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || data.error || 'Sorry, I could not read the whiteboard photo.',
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'error',
        additionalData: data.additionalData,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to upload whiteboard photo:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your whiteboard photo. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !chatStatus) {
      fetchChatStatus();
      fetchPlayers();
    }

    if (isOpen && chatStatus?.status === 'ready' && !initialMessage && defaultMessages.length === 0) {
      setDefaultMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your volleyball team assistant. I have access to data for ${chatStatus.playerCount} players and the official wallyball rulebook.\n\nI can help you with:\n- Player performance analysis\n- Team matchup suggestions\n- Answering questions about wallyball rules\n- Logging today's matches from a whiteboard photo (tap “Log today's matches” below)\n\nFor example, try asking:\n- "Who are the top players?"\n- "Suggest balanced teams for today"\n- "What are the rules around hitting the backwall in regular play?"`,
          timestamp: new Date().toISOString(),
          type: 'welcome',
        },
      ]);
    }

    if (isOpen && initialMessage && reportMessages.length === 0) {
      sendMessage(initialMessage);
    }
  }, [isOpen, chatStatus, initialMessage, reportMessages.length, defaultMessages.length]);

  const fetchChatStatus = async () => {
    try {
      const response = await fetch('/api/chatbot');
      const data = await response.json();
      setChatStatus(data);
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

  const isTeamSuggestionRequest = (prompt: string): boolean => {
    const teamKeywords = ['team', 'suggest', 'balance', 'matchup', 'formation'];
    const lowerPrompt = prompt.toLowerCase();
    return teamKeywords.some(keyword => lowerPrompt.includes(keyword));
  };

  const sendMessage = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input;
    if (!messageToSend.trim() || isLoading) return;

    if (isTeamSuggestionRequest(messageToSend)) {
      setPendingTeamSuggestionPrompt(messageToSend);
      setShowPlayerSelector(true);
      setInput('');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await response.json();

      if (!response.ok) {
        const isUnauthorized = response.status === 401;
        const errorMsg =
          data.response ||
          (isUnauthorized
            ? 'You must be signed in as an admin to use the chatbot.'
            : data.error || 'Sorry, I encountered an error processing your request. Please try again.');
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: errorMsg,
            timestamp: data.timestamp || new Date().toISOString(),
            type: isUnauthorized ? 'unauthorized' : 'error',
          },
        ]);
        return;
      }

      const hasUsedRules =
        data.additionalData &&
        typeof data.additionalData === 'object' &&
        'usedRules' in data.additionalData;
      const usedRulesValue = hasUsedRules ? (data.additionalData as any).usedRules : false;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'No response received.',
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type,
        additionalData: data.additionalData,
        usedRules: usedRulesValue,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'error',
        },
      ]);
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
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
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
      timestamp: new Date().toISOString(),
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
            players: selectedPlayers,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const isUnauthorized = response.status === 401;
        const errorMsg =
          data.response ||
          (isUnauthorized
            ? 'You must be signed in as an admin to use team suggestions.'
            : data.error || 'Sorry, I encountered an error generating team suggestions. Please try again.');
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: errorMsg,
            timestamp: data.timestamp || new Date().toISOString(),
            type: isUnauthorized ? 'unauthorized' : 'error',
          },
        ]);
        return;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'No team suggestion returned.',
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type,
        additionalData: data.additionalData,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'error',
        },
      ]);
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
          chatTranscript: messages,
        }),
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

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-20 right-20 sm:bottom-6 sm:right-28 h-14 w-14 rounded-full shadow-lg z-50 bg-gray-900 hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
            size="icon"
            aria-label="Chat Assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Volleyball Team Assistant
              </div>
              {!isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                  onClick={login}
                >
                  Admin Login
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            <ChatBotMessageList
              messages={messages}
              isLoading={isLoading}
              isAdmin={isAdmin}
              login={login}
              allPlayers={allPlayers}
              lastUploadedImage={lastUploadedImage}
              playerChoices={playerChoices}
              setPlayerChoices={setPlayerChoices}
              setMessages={setMessages}
              setIsLoading={setIsLoading}
              onUseMatchup={onUseMatchup}
              onRecordMatch={onRecordMatch}
              onLogMatch={logMatch}
              onClose={() => setIsOpen(false)}
              onOpenFeedback={openFeedbackDialog}
              messagesEndRef={messagesEndRef}
            />

            <div className="border-t p-4">
              <ChatBotQuickActions
                isLoading={isLoading}
                onQuickAction={handleQuickAction}
                onUploadWhiteboard={() => whiteboardInputRef.current?.click()}
              />
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
                  onClick={() => whiteboardInputRef.current?.click()}
                  disabled={isLoading}
                  aria-label="Upload image"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="file"
                ref={whiteboardInputRef}
                onChange={handleWhiteboardUpload}
                className="hidden"
                accept="image/*"
                data-testid="whiteboard-file-input"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
                data-testid="legacy-file-input"
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

      <ChatBotFeedbackDialog
        feedbackDialog={feedbackDialog}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        onClose={() => {
          setFeedbackDialog({ isOpen: false, messageIndex: -1, type: 'positive' });
          setFeedbackText('');
        }}
        onSubmit={submitFeedback}
      />
    </>
  );
}
