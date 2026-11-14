'use client';

import ReactMarkdown from 'react-markdown';
import { Bot, User, ThumbsUp, ThumbsDown, FileText, Users, TrendingUp, Gavel, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { WhiteboardResultsCard } from '../WhiteboardResultsCard';
import { WhiteboardMatch } from '../../lib/whiteboard';
import { MatchResultsResponse, TeamGrouping } from '../../lib/types';
import {
  ChatMessage,
  ChatPlayer,
  isMatchResult,
  isTeamSuggestion,
  isTeamGrouping,
  TeamSuggestionCard,
  MultipleTeamSuggestions,
  MatchResultsCard,
  PlayerDisambiguationCard,
  TeamGroupingCard,
  MultipleTeamGroupings,
  MultipleMatchResults,
} from './ChatBotCards';
import { MatchResult } from '../../lib/types';

function formatMessageTime(timestamp?: string): string {
  if (!timestamp) return new Date().toLocaleTimeString();
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? new Date().toLocaleTimeString() : date.toLocaleTimeString();
}

export function ChatBotMessageList({
  messages,
  isLoading,
  isAdmin,
  login,
  allPlayers,
  lastUploadedImage,
  playerChoices,
  setPlayerChoices,
  setMessages,
  setIsLoading,
  onUseMatchup,
  onRecordMatch,
  onLogMatch,
  onClose,
  onOpenFeedback,
  messagesEndRef,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  isAdmin: boolean;
  login: () => void;
  allPlayers: ChatPlayer[];
  lastUploadedImage: File | null;
  playerChoices: { [key: string]: string };
  setPlayerChoices: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onUseMatchup?: (teamOne: number[], teamTwo: number[]) => void;
  onRecordMatch?: (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => void;
  onLogMatch: (result: MatchResult) => void;
  onClose: () => void;
  onOpenFeedback: (messageIndex: number, type: 'positive' | 'negative') => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
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
                  message.type === 'team_suggestion' ? null : (
                    <div className="text-sm prose prose-sm max-w-none prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-ul:text-inherit prose-ol:text-inherit prose-li:text-inherit prose-headings:mb-2 prose-headings:mt-2 prose-p:mb-2 prose-p:mt-0 prose-ul:my-2 prose-li:my-0">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                )}

                {message.imagePreview && (
                  <div className="mt-2">
                    <img
                      src={message.imagePreview}
                      alt="Uploaded preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {message.type === 'team_suggestion' && message.additionalData && (
                  Array.isArray(message.additionalData) && message.additionalData.every(isTeamSuggestion) ? (
                    <MultipleTeamSuggestions
                      suggestions={message.additionalData}
                      onUseMatchup={onUseMatchup}
                      onRecordMatch={onRecordMatch}
                      onClose={onClose}
                    />
                  ) : (
                    isTeamSuggestion(message.additionalData) && (
                      <TeamSuggestionCard
                        data={message.additionalData}
                        index={0}
                        onUseMatchup={onUseMatchup}
                        onRecordMatch={onRecordMatch}
                        onClose={onClose}
                      />
                    )
                  )
                )}

                {message.type === 'match_results' && message.additionalData && (
                  Array.isArray(message.additionalData) ? (
                    message.additionalData.map((result, idx) =>
                      isMatchResult(result) && (
                        <MatchResultsCard key={idx} result={result} onLogMatch={onLogMatch} />
                      )
                    )
                  ) : (
                    isMatchResult(message.additionalData) && (
                      <MatchResultsCard result={message.additionalData} onLogMatch={onLogMatch} />
                    )
                  )
                )}

                {message.type === 'whiteboard_results' && message.additionalData && (
                  (() => {
                    const data = message.additionalData as any;
                    if (data.matches && Array.isArray(data.matches)) {
                      return (
                        <WhiteboardResultsCard
                          matches={data.matches as WhiteboardMatch[]}
                          initialDate={data.date || new Date().toISOString().split('T')[0]}
                          roster={Array.isArray(data.roster) ? data.roster : []}
                        />
                      );
                    }
                    return null;
                  })()
                )}

                {message.type === 'player_disambiguation' && message.additionalData && (
                  (() => {
                    const data = message.additionalData as any;
                    if (data.ambiguousLetters && data.ambiguousLetters.length > 0) {
                      const mockResponse = {
                        hasAmbiguity: true,
                        ambiguousLetters: data.ambiguousLetters,
                        matches: [],
                      };
                      return (
                        <PlayerDisambiguationCard
                          response={mockResponse as MatchResultsResponse}
                          originalImage={lastUploadedImage || undefined}
                          playerChoices={playerChoices}
                          setPlayerChoices={setPlayerChoices}
                          setMessages={setMessages}
                          setIsLoading={setIsLoading}
                        />
                      );
                    }
                    return null;
                  })()
                )}

                {(message.type === 'team_groupings' || message.type === 'match_results') && message.additionalData && (
                  (() => {
                    const data = message.additionalData as any;
                    if (data.hasAmbiguity && data.ambiguousLetters) {
                      return (
                        <PlayerDisambiguationCard
                          response={data as MatchResultsResponse}
                          originalImage={lastUploadedImage || undefined}
                          playerChoices={playerChoices}
                          setPlayerChoices={setPlayerChoices}
                          setMessages={setMessages}
                          setIsLoading={setIsLoading}
                        />
                      );
                    } else if (data.matches) {
                      return (
                        <MultipleMatchResults
                          matches={data.matches}
                          allPlayers={allPlayers}
                          onRecordMatch={onRecordMatch}
                          onClose={onClose}
                        />
                      );
                    } else if (data.teams) {
                      return <MultipleTeamGroupings groupings={data.teams} />;
                    } else if (Array.isArray(message.additionalData)) {
                      return (
                        <MultipleTeamGroupings
                          groupings={message.additionalData.filter(isTeamGrouping) as TeamGrouping[]}
                        />
                      );
                    } else if (isTeamGrouping(message.additionalData)) {
                      return <TeamGroupingCard grouping={message.additionalData as TeamGrouping} />;
                    }
                    return null;
                  })()
                )}

                {(message.usedRules || (message.additionalData && (message.additionalData as any).usedRules)) &&
                  message.role === 'assistant' && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs text-blue-800 flex-1">Referenced official rules document</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2 border-blue-300 hover:bg-blue-100"
                        onClick={() => window.open('/Wallyball_Rules_2012.pdf', '_blank')}
                      >
                        Open PDF
                      </Button>
                    </div>
                  )}

                {message.type === 'unauthorized' && !isAdmin && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-white text-gray-800 hover:bg-gray-50 border-gray-300"
                      onClick={login}
                    >
                      Log In as Admin
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatMessageTime(message.timestamp)}
              </div>
              {message.role === 'assistant' && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenFeedback(index, 'positive')}
                    className="h-6 w-6 p-0 hover:bg-green-100"
                    aria-label="Good response"
                  >
                    <ThumbsUp className="h-3 w-3 text-gray-400 hover:text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenFeedback(index, 'negative')}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                    aria-label="Bad response"
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
          <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-gray-500" />
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export function ChatBotQuickActions({
  isLoading,
  onQuickAction,
  onUploadWhiteboard,
}: {
  isLoading: boolean;
  onQuickAction: (prompt: string) => void;
  onUploadWhiteboard: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onQuickAction('Who are the top performing players?')}
        disabled={isLoading}
        className="text-xs"
      >
        <TrendingUp className="w-3 h-3 mr-1" />
        Top Players
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onQuickAction('Suggest balanced teams for today')}
        disabled={isLoading}
        className="text-xs"
      >
        <Users className="w-3 h-3 mr-1" />
        Team Suggestions
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (isLoading) return;
          onUploadWhiteboard();
        }}
        disabled={isLoading}
        className="text-xs"
      >
        <ClipboardList className="w-3 h-3 mr-1" />
        Log today&apos;s matches
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onQuickAction('What are the rules around hitting the backwall in regular play?')}
        disabled={isLoading}
        className="text-xs"
      >
        <Gavel className="w-3 h-3 mr-1" />
        Wallyball Rules
      </Button>
    </div>
  );
}

export function ChatBotFeedbackDialog({
  feedbackDialog,
  feedbackText,
  setFeedbackText,
  onClose,
  onSubmit,
}: {
  feedbackDialog: { isOpen: boolean; messageIndex: number; type: 'positive' | 'negative' };
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={feedbackDialog.isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
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
              ? 'What did you like about this response?'
              : 'How can we improve this response?'}
          </div>

          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-[100px]"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!feedbackText.trim()}>
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
