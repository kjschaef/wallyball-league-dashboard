export interface PlayerStats {
  id: number;
  name: string;
  yearsPlayed: number;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  winPercentage: number;
  totalPlayingTime: number;

  actualWinPercentage?: number;
}

export interface TeamSuggestion {
  scenario?: string;
  teamOne: PlayerStats[];
  teamTwo: PlayerStats[];
  balanceScore: number;
  expectedWinProbability: number;
  reasoning: string;
}

export interface TeamGrouping {
  players: string[];
  letters: string[];
  wins?: number;
  needsClarification?: boolean;
}

export interface MatchResult {
  matchNumber: number;
  teamOne: TeamGrouping;
  teamTwo: TeamGrouping;
}

export interface AmbiguousLetter {
  letter: string;
  possiblePlayers: string[];
}

export interface MatchResultsResponse {
  hasAmbiguity: boolean;
  ambiguousLetters?: AmbiguousLetter[];
  matches: MatchResult[];
}
