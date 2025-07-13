import { NextRequest, NextResponse } from 'next/server';
import {
  analyzePlayerPerformance,
  suggestTeamMatchups,
  queryWallyballRules,
  PlayerStats,
} from '../../lib/openai';

interface ChatRequest {
  message: string;
  context?: {
    type: 'general' | 'team_suggestion' | 'match_analysis';
    players?: number[]; // player IDs for context
  };
}

async function fetchPlayerStats(): Promise<PlayerStats[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/player-stats`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch player stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context }: ChatRequest = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch current player statistics
    const allPlayers = await fetchPlayerStats();

    if (allPlayers.length === 0) {
      return NextResponse.json({
        response: "I don't have access to any player data right now. Please make sure there are players in the system and try again.",
        type: 'error'
      });
    }

    let response = '';
    let responseType = 'general';
    let additionalData: any = null;

    // Determine intent and handle accordingly
    const lowerMessage = message.toLowerCase();

    // Check for team suggestions first (higher priority)
    if (lowerMessage.includes('team') && (lowerMessage.includes('suggest') || lowerMessage.includes('matchup') || lowerMessage.includes('who should play'))) {
      // Team suggestion request
      const availablePlayers = context?.players 
        ? allPlayers.filter(p => context.players!.includes(p.id))
        : allPlayers;

      if (availablePlayers.length < 4) {
        response = "I need at least 4 players to suggest balanced teams. Please let me know which players are available today.";
        responseType = 'error';
      } else {
        const teamSuggestions = await suggestTeamMatchups(availablePlayers);

        response = `Here are my suggested team matchups for multiple matches:\n\n${teamSuggestions.map((suggestion, index) => 
          `**${suggestion.scenario || `Matchup ${index + 1}`}**\n**Team 1:** ${suggestion.teamOne?.map(p => p?.name).filter(Boolean).join(', ') || 'Team assignment failed'}\n**Team 2:** ${suggestion.teamTwo?.map(p => p?.name).filter(Boolean).join(', ') || 'Team assignment failed'}\n**Balance Score:** ${suggestion.balanceScore || 0}/100\n**Expected Win Probability:** Team 1 has a ${suggestion.expectedWinProbability || 50}% chance\n**Reasoning:** ${suggestion.reasoning || 'No reasoning provided'}`
        ).join('\n\n---\n\n')}`;

        responseType = 'team_suggestion';
        additionalData = teamSuggestions;
      }
    } else if (lowerMessage.includes('match') && lowerMessage.includes('analysis')) {
      response = "Please specify which teams you'd like me to analyze, or use the team suggestion feature first.";
      responseType = 'match_analysis';
    } else {
      // Check for rules queries
      const rulesKeywords = ['rule', 'regulation', 'official', 'legal', 'allowed', 'forbidden', 'court', 'net', 'serve', 'point', 'game', 'scoring', 'boundary', 'rotation'];
      const isRulesQuery = rulesKeywords.some(keyword => lowerMessage.includes(keyword));

      if (isRulesQuery) {
        // Rules query
        response = await queryWallyballRules(message);
        responseType = 'rules_query';
      } else {
      // General performance analysis
        response = await analyzePlayerPerformance(allPlayers, message);
        responseType = 'performance_analysis';
      }
    }

    return NextResponse.json({
      response,
      type: responseType,
      timestamp: new Date().toISOString(),
      playerCount: allPlayers.length,
      additionalData
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const playerStats = await fetchPlayerStats();

    return NextResponse.json({
      status: 'ready',
      playerCount: playerStats.length,
      capabilities: [
        'Player performance analysis',
        'Team matchup suggestions', 
        'Match predictions',
        'Statistical comparisons',
        'Performance trends',
        'Official Wallyball rules queries'
      ],
      sampleQueries: [
        "Who are the top performing players this season?",
        "Suggest balanced teams for today's match",
        "Which players are on winning streaks?",
        "Compare John and Sarah's performance",
        "Who should play today if we have 8 players available?",
        "What are the serving rules in Wallyball?",
        "How is scoring done in Wallyball?",
        "What are the court boundaries?"
      ]
    });
  } catch (error) {
    console.error('Chatbot status error:', error);
    return NextResponse.json(
      { error: 'Failed to get chatbot status' },
      { status: 500 }
    );
  }
}