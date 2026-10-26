import { WallyballRulesRAG } from '../../lib/rag';
import { createChatCompletion } from './modelClient';
import {
  playerPerformanceSystemPrompt,
  rulesSystemPrompt,
  dailySummarySystemPrompt
} from './prompts';

// Model client handles OpenAI initialization and model selection

export interface PlayerSummaryStats {
  name: string;
  seasonGames: number;
  lifetimeGames: number;
  winPercentage: number;
}

export interface RecentMatch {
  id: number;
  date: string;
  team_one_games_won: number;
  team_two_games_won: number;
  team_one_player_one_id: number | null;
  team_one_player_two_id: number | null;
  team_one_player_three_id: number | null;
  team_two_player_one_id: number | null;
  team_two_player_two_id: number | null;
  team_two_player_three_id: number | null;
  gameScores?: Array<{ gameNumber: number; teamOneScore: number; teamTwoScore: number }>;
}

export async function generateDailySummary(
  matches: RecentMatch[],
  mergedStats: PlayerSummaryStats[]
): Promise<string> {
  try {
    const response = await createChatCompletion({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: dailySummarySystemPrompt(matches, mergedStats)
        },
        {
          role: "user",
          content: "Generate the daily summary."
        }
      ],
      max_completion_tokens: 5000
    });

    return response.choices[0].message.content || "Unable to generate daily summary.";
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return "I'm having trouble generating the daily summary right now. Please try again later.";
  }
}

async function searchWallyballRules(query: string): Promise<{ text: string; usedRules: boolean }> {
  try {
    const rag = WallyballRulesRAG.getInstance();
    const results = await rag.search(query);
    return {
      text: results.length > 0 ? results.join('\n\n---\n\n') : 'No relevant rules found.',
      usedRules: results.length > 0
    };
  } catch (error) {
    console.error('Error searching Wallyball rules via RAG:', error);
    return {
      text: 'Wallyball rules document is not available at this time.',
      usedRules: false
    };
  }
}

import { PlayerStats } from './types';
import { generateBalancedTeams } from './team-balancer';

export type { PlayerStats }; // Re-export for use in other modules
export const suggestTeamMatchups = generateBalancedTeams;

export async function detectIntent(query: string): Promise<'rules_query' | 'performance_analysis' | 'general_chat'> {
  try {
    const response = await createChatCompletion({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a classifier for a Wallyball league chatbot. Classify the user's query into one of the following categories:
          
          1. 'rules_query': The user is asking about the rules, regulations, court dimensions, scoring, legal plays, or how the game is played.
          2. 'performance_analysis': The user is asking about player stats, team suggestions, matchups, win rates, or who is the best player.
          3. 'general_chat': The user is saying hello, asking how you are, or making small talk that doesn't require specific data.
          
          Return ONLY the category name.`
        },
        {
          role: "user",
          content: query
        }
      ],
      max_completion_tokens: 1000
    });

    const content = response.choices[0].message.content?.trim().toLowerCase() || 'general_chat';

    if (content.includes('rules')) return 'rules_query';
    if (content.includes('performance') || content.includes('analysis')) return 'performance_analysis';
    return 'general_chat';
  } catch (error) {
    console.error('Error detecting intent:', error);
    // Fallback to performance analysis as it's the main feature
    return 'performance_analysis';
  }
}

async function shouldConsultRules(query: string): Promise<boolean> {
  try {
    const response = await createChatCompletion({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "Analyze the user's query and determine if it references any rules, regulations, or legalities of Wallyball. Return 'YES' if it does, and 'NO' otherwise."
        },
        { role: "user", content: query }
      ],
      max_completion_tokens: 1000
    });
    const content = response.choices[0].message.content?.trim().toUpperCase() || '';
    return content.includes('YES');
  } catch (error) {
    console.error('Error checking for rules:', error);
    return false;
  }
}

export async function analyzePlayerPerformance(
  lifetimePlayers: PlayerStats[],
  currentSeasonPlayers: PlayerStats[],
  query: string
): Promise<{ response: string; usedRules: boolean }> {
  try {
    const formatPlayerSummary = (players: PlayerStats[]) => players.map(p => ({
      name: p.name,
      winPercentage: p.winPercentage,
      totalGames: p.record.totalGames,
      yearsPlayed: p.yearsPlayed
    }));

    const lifetimeSummary = formatPlayerSummary(lifetimePlayers);
    const currentSeasonSummary = formatPlayerSummary(currentSeasonPlayers);

    // Check if the query is about rules and get context from RAG
    let rulesContext = '';
    let usedRules = false;

    const needsRules = await shouldConsultRules(query);

    if (needsRules) {
      const rulesResult = await searchWallyballRules(query);
      rulesContext = `\n\nRelevant Wallyball Rules:\n${rulesResult.text}`;
      usedRules = rulesResult.usedRules;
    }

    const response = await createChatCompletion({
      model: "gpt-5-mini",
      max_completion_tokens: 5000,
      messages: [
        {
          role: "system",
          content: playerPerformanceSystemPrompt(lifetimeSummary, currentSeasonSummary, rulesContext)
        },
        {
          role: "user",
          content: query
        }
      ]
    });

    return {
      response: response.choices[0].message.content || "Unable to analyze performance data.",
      usedRules
    };
  } catch (error) {
    console.error('Error analyzing player performance:', error);
    return {
      response: "I'm having trouble analyzing the performance data right now. Please try again.",
      usedRules: false
    };
  }
}

export async function queryWallyballRules(query: string): Promise<{ response: string; usedRules: boolean }> {
  try {
    const rulesResult = await searchWallyballRules(query);

    const response = await createChatCompletion({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: rulesSystemPrompt(rulesResult.text)
        },
        {
          role: "user",
          content: query
        }
      ],
      max_completion_tokens: 2000
    });

    return {
      response: response.choices[0].message.content || "Unable to find information about that rule.",
      usedRules: rulesResult.usedRules
    };
  } catch (error) {
    console.error('Error querying Wallyball rules:', error);
    return {
      response: "I'm having trouble accessing the rules document right now. Please try again.",
      usedRules: false
    };
  }
}

export {
  findPlayersInImage,
  analyzeMatchesWithConfirmedPlayers,
  analyzeMatchResultsImage
} from './legacyVision';

export {
  prepareVisionJpegBuffer,
  analyzeWhiteboardScores
} from './whiteboardVision';
