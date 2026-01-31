import { NextRequest, NextResponse } from 'next/server';
import {
  analyzePlayerPerformance,
  suggestTeamMatchups,
  queryWallyballRules,

  detectIntent
} from '../../lib/openai';
import { PlayerStats } from '../../lib/types';

interface ChatRequest {
  message: string;
  context?: {
    type: 'general' | 'team_suggestion' | 'match_analysis';
    players?: number[]; // player IDs for context
  };
}

async function fetchPlayerStats(season?: string): Promise<PlayerStats[]> {
  try {
    // Construct the base URL properly for different environments
    let baseUrl: string;

    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    } else if (process.env.NODE_ENV === 'production') {
      // For production deployments, use the actual deployment URL
      baseUrl = 'https://wallyball-league-dashboard.vercel.app';
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // Default to localhost for development
      baseUrl = 'http://localhost:5000';
    }

    let url = `${baseUrl}/api/player-stats`;
    if (season) {
      url += `?season=${season}`;
    }

    // fetch player stats from internal API
    const response = await fetch(url, {
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to fetch player stats: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw new Error(`Failed to fetch player stats`);
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

    // Fetch current player statistics (Lifetime and Current Season)
    const [lifetimeStats, currentSeasonStats] = await Promise.all([
      fetchPlayerStats(), // Default is lifetime
      fetchPlayerStats('current') // Explicitly ask for current season
    ]);

    if (lifetimeStats.length === 0) {
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
      // Team suggestion request - use Current Season stats for better relevance on "who is playing well now"
      // But fallback to lifetime if current season has little data? 
      // For now, let's stick to lifetime for balancing as it has more data points for skill estimation,
      // unless we want to prioritize recent form. Let's stick to lifetime for consistency in balancing.
      const availablePlayers = context?.players
        ? lifetimeStats.filter(p => context.players!.includes(p.id))
        : lifetimeStats;

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
    } else {
      // Use LLM to detect intent
      const intent = await detectIntent(message);
      console.log('Detected intent:', intent);

      if (intent === 'rules_query') {
        // Rules query
        const rulesResult = await queryWallyballRules(message);
        response = rulesResult.response;
        responseType = 'rules_query';
        additionalData = { usedRules: rulesResult.usedRules };
        console.log('Rules result usedRules:', rulesResult.usedRules);
      } else {
        // General performance analysis or general chat
        // We treat general chat as performance analysis for now to keep the persona consistent
        // and allow access to player context if needed
        const analysisResult = await analyzePlayerPerformance(lifetimeStats, currentSeasonStats, message);
        response = analysisResult.response;
        responseType = 'performance_analysis';
        additionalData = { usedRules: analysisResult.usedRules };
        console.log('Analysis result usedRules:', analysisResult.usedRules);
      }
    }

    return NextResponse.json({
      response,
      type: responseType,
      timestamp: new Date().toISOString(),
      playerCount: lifetimeStats.length,
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
