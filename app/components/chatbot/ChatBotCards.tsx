'use client';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { TeamSuggestion, MatchResult, MatchResultsResponse, TeamGrouping } from '../../lib/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: string;
  additionalData?: any;
  imagePreview?: string;
  usedRules?: boolean;
}

export interface ChatPlayer {
  id: number;
  name: string;
  winPercentage: number;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  actualWinPercentage?: number;
}

export function isMatchResult(data: any): data is MatchResult {
  return data && typeof data === 'object' && 'matchNumber' in data && 'teamOne' in data && 'teamTwo' in data;
}

export function isTeamSuggestion(data: any): data is TeamSuggestion {
  return data && typeof data === 'object' && 'teamOne' in data && 'teamTwo' in data;
}

export function isTeamGrouping(data: any): data is TeamGrouping {
  return data && typeof data === 'object' && 'teamNumber' in data && 'players' in data && 'letters' in data;
}

export function TeamSuggestionCard({
  data,
  index,
  onUseMatchup,
  onRecordMatch,
  onClose,
}: {
  data: TeamSuggestion;
  index: number;
  onUseMatchup?: (teamOne: number[], teamTwo: number[]) => void;
  onRecordMatch?: (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => void;
  onClose: () => void;
}) {
  return (
    <Card className="mt-2 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        {data.scenario && (
          <h4 className="font-semibold text-blue-900 mb-3 text-center">{data.scenario}</h4>
        )}

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-white/50 p-2 rounded">
            <h5 className="font-semibold text-blue-900 mb-2">Team 1</h5>
            {data.teamOne.map(player => (
              <div key={player.id} className="text-sm flex justify-between">
                <span>{player.name}</span>
                <span className="text-gray-600">{player.winPercentage.toFixed(0)}%</span>
              </div>
            ))}
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-blue-100">
              Avg: {Math.round(data.teamOne.reduce((sum, p) => sum + p.winPercentage, 0) / data.teamOne.length)}%
            </div>
          </div>
          <div className="bg-white/50 p-2 rounded">
            <h5 className="font-semibold text-blue-900 mb-2">Team 2</h5>
            {data.teamTwo.map(player => (
              <div key={player.id} className="text-sm flex justify-between">
                <span>{player.name}</span>
                <span className="text-gray-600">{player.winPercentage.toFixed(0)}%</span>
              </div>
            ))}
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-blue-100">
              Avg: {Math.round(data.teamTwo.reduce((sum, p) => sum + p.winPercentage, 0) / data.teamTwo.length)}%
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-900 w-20">Balance</span>
            <Progress value={data.balanceScore} className="h-2 flex-1" />
            <span className="text-xs font-bold text-blue-700">{data.balanceScore}/100</span>
          </div>
        </div>

        <div className="text-xs text-blue-600 mb-3 italic bg-blue-100/50 p-2 rounded">
          {data.reasoning}
        </div>

        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            const teamOneIds = data.teamOne.map(player => player.id);
            const teamTwoIds = data.teamTwo.map(player => player.id);

            if (onUseMatchup) {
              onClose();
              onUseMatchup(teamOneIds, teamTwoIds);
            } else if (onRecordMatch) {
              onClose();
              onRecordMatch(teamOneIds, teamTwoIds, 0, 0);
            } else {
              alert(`Team matchup ${index + 1} will be integrated with match recording in the next phase!`);
            }
          }}
        >
          Use This Matchup
        </Button>
      </CardContent>
    </Card>
  );
}

export function MultipleTeamSuggestions({
  suggestions,
  onUseMatchup,
  onRecordMatch,
  onClose,
}: {
  suggestions: TeamSuggestion[];
  onUseMatchup?: (teamOne: number[], teamTwo: number[]) => void;
  onRecordMatch?: (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 mt-2">
      {suggestions.map((suggestion, index) => (
        <TeamSuggestionCard
          key={index}
          data={suggestion}
          index={index}
          onUseMatchup={onUseMatchup}
          onRecordMatch={onRecordMatch}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

export function MatchResultsCard({
  result,
  onLogMatch,
}: {
  result: MatchResult;
  onLogMatch: (result: MatchResult) => void;
}) {
  return (
    <Card className="mt-2 bg-green-50 border-green-200">
      <CardContent className="p-4">
        <h4 className="font-semibold text-green-900 mb-3 text-center">Match {result.matchNumber}</h4>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <h5 className="font-semibold text-green-900 mb-2">Team 1</h5>
            <p className="text-sm">{result.teamOne.players.join(', ')}</p>
            <p className="text-sm">Wins: {result.teamOne.wins}</p>
          </div>
          <div>
            <h5 className="font-semibold text-green-900 mb-2">Team 2</h5>
            <p className="text-sm">{result.teamTwo.players.join(', ')}</p>
            <p className="text-sm">Wins: {result.teamTwo.wins}</p>
          </div>
        </div>
        <Button className="w-full" variant="outline" onClick={() => onLogMatch(result)}>
          Log Match
        </Button>
      </CardContent>
    </Card>
  );
}

export function MatchResultCard({
  match,
  allPlayers,
  onRecordMatch,
  onClose,
}: {
  match: MatchResult;
  allPlayers: ChatPlayer[];
  onRecordMatch?: (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => void;
  onClose: () => void;
}) {
  const hasAmbiguity = match.teamOne.needsClarification || match.teamTwo.needsClarification;
  const cardColor = hasAmbiguity ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200';
  const textColor = hasAmbiguity ? 'text-orange-900' : 'text-purple-900';
  const lightTextColor = hasAmbiguity ? 'text-orange-700' : 'text-purple-700';
  const mediumTextColor = hasAmbiguity ? 'text-orange-800' : 'text-purple-800';

  const handleRecordMatch = () => {
    if (!onRecordMatch || hasAmbiguity) return;

    const getPlayerIds = (playerNames: string[]): number[] => {
      return playerNames
        .map(name => allPlayers.find(p => p.name === name)?.id)
        .filter((id): id is number => id !== undefined);
    };

    const teamOneIds = getPlayerIds(match.teamOne.players);
    const teamTwoIds = getPlayerIds(match.teamTwo.players);

    if (
      teamOneIds.length === match.teamOne.players.length &&
      teamTwoIds.length === match.teamTwo.players.length
    ) {
      onClose();
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
          <Button onClick={handleRecordMatch} className="w-full" variant="outline">
            Record This Match
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function PlayerDisambiguationCard({
  response,
  originalImage,
  playerChoices,
  setPlayerChoices,
  setMessages,
  setIsLoading,
}: {
  response: MatchResultsResponse;
  originalImage?: File;
  playerChoices: { [key: string]: string };
  setPlayerChoices: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const handlePlayerChoice = (letter: string, player: string) => {
    setPlayerChoices(prev => ({ ...prev, [letter]: player }));
  };

  const allChoicesMade =
    response.ambiguousLetters?.every(amb => {
      return playerChoices[amb.letter];
    }) || false;

  const finalizeClarification = async () => {
    if (!response.ambiguousLetters || !allChoicesMade) return;

    if (response.matches && response.matches.length > 0) {
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
            needsClarification: false,
          };
        };

        return {
          ...match,
          teamOne: updateTeam(match.teamOne),
          teamTwo: updateTeam(match.teamTwo),
        };
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Great! Here are the finalized match results:',
        timestamp: new Date().toISOString(),
        type: 'match_results',
        additionalData: { matches: finalizedMatches, hasAmbiguity: false },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } else {
      if (!originalImage) return;

      try {
        setIsLoading(true);
        const confirmedPlayers = Object.values(playerChoices);

        const formData = new FormData();
        formData.append('image', originalImage);
        formData.append('confirmedPlayers', JSON.stringify(confirmedPlayers));
        formData.append('step', '2');

        const apiRes = await fetch('/api/chatbot/image', {
          method: 'POST',
          body: formData,
        });

        if (!apiRes.ok) {
          throw new Error(`HTTP error! status: ${apiRes.status}`);
        }

        const result = await apiRes.json();

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString(),
          type: result.type,
          additionalData: result.additionalData,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error in step 2:', error);
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your confirmed player choices. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'error',
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
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handlePlayerChoice(amb.letter, player)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-1 ${
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
}

export function TeamGroupingCard({ grouping }: { grouping: TeamGrouping }) {
  return (
    <Card className={`mt-2 ${grouping.needsClarification ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-semibold ${grouping.needsClarification ? 'text-orange-900' : 'text-purple-900'}`}>
            Team {grouping.needsClarification && '(Needs Clarification)'}
          </h4>
          {grouping.wins !== undefined && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                grouping.needsClarification
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-purple-200 text-purple-800'
              }`}
            >
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
            <p className={`text-sm font-medium ${grouping.needsClarification ? 'text-orange-800' : 'text-purple-800'}`}>
              Players:
            </p>
            <p className={`text-sm ${grouping.needsClarification ? 'text-orange-700' : 'text-purple-700'}`}>
              {grouping.players.join(', ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MultipleTeamGroupings({ groupings }: { groupings: TeamGrouping[] }) {
  return (
    <div className="space-y-2 mt-2">
      {groupings.map((grouping, index) => (
        <TeamGroupingCard key={index} grouping={grouping} />
      ))}
    </div>
  );
}

export function MultipleMatchResults({
  matches,
  allPlayers,
  onRecordMatch,
  onClose,
}: {
  matches: MatchResult[];
  allPlayers: ChatPlayer[];
  onRecordMatch?: (teamOne: number[], teamTwo: number[], teamOneWins: number, teamTwoWins: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-2 mt-2">
      {matches.map((match, index) => (
        <MatchResultCard
          key={index}
          match={match}
          allPlayers={allPlayers}
          onRecordMatch={onRecordMatch}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
