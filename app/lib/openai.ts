import OpenAI from "openai";
import { WallyballRulesMCPServer } from '../../lib/mcp-server';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// MCP server instance for rules queries
let mcpServer: WallyballRulesMCPServer | null = null;

async function getMCPServer(): Promise<WallyballRulesMCPServer | null> {
  if (!mcpServer) {
    try {
      mcpServer = new WallyballRulesMCPServer();
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
      return null;
    }
  }
  return mcpServer;
}

async function searchWallyballRules(query: string): Promise<string> {
  try {
    const server = await getMCPServer();
    if (!server) {
      return 'Wallyball rules document is not available at this time.';
    }
    // Simulate MCP server call
    const result = server.searchRules(query);
    return result.content[0]?.text || 'No rules found for that query.';
  } catch (error) {
    console.error('Error searching Wallyball rules via MCP:', error);
    return 'Wallyball rules document is not available at this time.';
  }
}

async function analyzePlayersWithMCP(playerIds: number[], analysisType: string): Promise<string> {
  try {
    const server = await getMCPServer();
    if (!server) {
      return 'Player analysis service is not available at this time.';
    }
    const result = await server.analyzePlayerPerformance(playerIds, analysisType);
    return result.content[0]?.text || 'No analysis available.';
  } catch (error) {
    console.error('Error analyzing players via MCP:', error);
    return 'Player analysis service is not available at this time.';
  }
}

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
  streak: {
    type: 'wins' | 'losses';
    count: number;
  };
  actualWinPercentage?: number;
  inactivityPenalty?: number;
}

export interface TeamSuggestion {
  scenario?: string;
  teamOne: PlayerStats[];
  teamTwo: PlayerStats[];
  balanceScore: number;
  expectedWinProbability: number;
  reasoning: string;
}

export async function analyzePlayerPerformance(
  players: PlayerStats[],
  query: string
): Promise<string> {
  try {
    const playerSummary = players.map(p => ({
      name: p.name,
      winPercentage: p.winPercentage,
      totalGames: p.record.totalGames,
      streak: `${p.streak.count} ${p.streak.type}`,
      yearsPlayed: p.yearsPlayed
    }));

    // Check if the query is about rules and get context from MCP server
    let rulesContext = '';
    const rulesKeywords = ['rule', 'regulation', 'official', 'legal', 'allowed', 'forbidden', 'court', 'net', 'serve', 'point', 'game'];
    const isRulesQuery = rulesKeywords.some(keyword => query.toLowerCase().includes(keyword));

    if (isRulesQuery) {
      const rules = await searchWallyballRules(query);
      rulesContext = `\n\nRelevant Wallyball Rules:\n${rules}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a wallyball performance analyst with access to official rules. Analyze player statistics and provide insights.

Current player data: ${JSON.stringify(playerSummary, null, 2)}${rulesContext}

Guidelines:
- Focus on win percentages, streaks, and recent performance
- Consider inactivity penalties in your analysis
- Provide specific, actionable insights
- Be concise but informative
- Use volleyball/wallyball terminology appropriately
- When asked about rules, reference the official Wallyball Rules 2012 document
- If asked about specific rules or regulations, provide accurate information from the rules document`
        },
        {
          role: "user",
          content: query
        }
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Unable to analyze performance data.";
  } catch (error) {
    console.error('Error analyzing player performance:', error);
    return "I'm having trouble analyzing the performance data right now. Please try again.";
  }
}

export async function suggestTeamMatchups(
  availablePlayers: PlayerStats[]
): Promise<TeamSuggestion[]> {
  try {
    if (availablePlayers.length < 4) {
      throw new Error(`Need at least 4 players for team suggestions`);
    }

    // Determine team sizes based on total players
    let team1Size: number, team2Size: number;
    if (availablePlayers.length === 4) {
      team1Size = 2;
      team2Size = 2;
    } else if (availablePlayers.length === 5) {
      team1Size = 2;
      team2Size = 3;
    } else {
      // For 6+ players, use equal teams or as close as possible
      const playersPerTeam = Math.floor(availablePlayers.length / 2);
      team1Size = playersPerTeam;
      team2Size = availablePlayers.length - playersPerTeam;
    }

    const playerIds = availablePlayers.map(p => p.id);

    // Get MCP analysis for the selected players
    const mcpAnalysis = await analyzePlayersWithMCP(playerIds, 'matchup_optimization');

    const playerSummary = availablePlayers.map(p => ({
      name: p.name,
      winPercentage: p.winPercentage,
      totalGames: p.record.totalGames,
      streak: p.streak,
      actualWinPercentage: p.actualWinPercentage || p.winPercentage,
      inactivityPenalty: p.inactivityPenalty || 0
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a volleyball team formation expert. Create multiple balanced team matchups from available players.

Available players (${availablePlayers.length} total): ${JSON.stringify(playerSummary, null, 2)}

MCP Performance Analysis:
${mcpAnalysis}

IMPORTANT RULES:
- Team 1 must have exactly ${team1Size} players
- Team 2 must have exactly ${team2Size} players
- Each player can only be on ONE team (no duplicates between teams)
- Use ALL ${availablePlayers.length} available players across both teams
- No player should appear on both teams in any scenario

Your task:
1. Create 3 different team matchup scenarios
2. Each scenario should have Team 1 with ${team1Size} players and Team 2 with ${team2Size} players
3. Balance skill levels for competitive matches
4. Consider current streaks, performance trends, and inactivity penalties
5. Provide variety in team combinations for multiple matches
6. Provide a balance score (0-100, where 50 is perfectly balanced)
7. Estimate win probability for team one

Respond in JSON format:
{
  "matchups": [
    {
      "scenario": "Scenario 1: Balanced Experience",
      "teamOne": ["player1", "player2"],
      "teamTwo": ["player3", "player4"],
      "balanceScore": 75,
      "expectedWinProbability": 52,
      "reasoning": "Detailed explanation of team formation logic"
    },
    {
      "scenario": "Scenario 2: Streak Focus", 
      "teamOne": ["player2", "player3"],
      "teamTwo": ["player1", "player4"],
      "balanceScore": 68,
      "expectedWinProbability": 48,
      "reasoning": "Teams formed considering current streaks"
    },
    {
      "scenario": "Scenario 3: Mix & Match",
      "teamOne": ["player1", "player4"],
      "teamTwo": ["player2", "player3"],
      "balanceScore": 71,
      "expectedWinProbability": 55,
      "reasoning": "Alternative pairing for variety"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Create 3 different balanced team matchup scenarios from these ${availablePlayers.length} players. Team 1 needs ${team1Size} players, Team 2 needs ${team2Size} players. Ensure no player appears on both teams.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Map player names back to PlayerStats objects and validate
    const matchups = (result.matchups?.map((matchup: any) => {
      const teamOne = (matchup.teamOne?.map((name: string) => 
        availablePlayers.find(p => p.name === name)
      ).filter((p: PlayerStats | undefined): p is PlayerStats => p !== undefined) || []) as PlayerStats[];

      const teamTwo = (matchup.teamTwo?.map((name: string) => 
        availablePlayers.find(p => p.name === name)
      ).filter((p: PlayerStats | undefined): p is PlayerStats => p !== undefined) || []) as PlayerStats[];

      // Validate no duplicate players between teams
      const allPlayerIds = [...teamOne.map(p => p.id), ...teamTwo.map(p => p.id)];
      const hasDuplicates = allPlayerIds.length !== new Set(allPlayerIds).size;

      if (hasDuplicates || teamOne.length !== team1Size || teamTwo.length !== team2Size) {
        // Return fallback if validation fails
        return createFallbackMatchup(availablePlayers, team1Size, team2Size);
      }

      return {
        scenario: matchup.scenario,
        teamOne,
        teamTwo,
        balanceScore: matchup.balanceScore || 50,
        expectedWinProbability: matchup.expectedWinProbability || 50,
        reasoning: matchup.reasoning || "Team formation based on balanced skill levels"
      };
    }) || []);

    return matchups.length > 0 ? matchups : [createFallbackMatchup(availablePlayers, team1Size, team2Size)];

  } catch (error) {
    console.error('Error suggesting team matchups:', error);
    return [createFallbackMatchup(availablePlayers)];
  }
}

function createFallbackMatchup(availablePlayers: PlayerStats[], team1Size?: number, team2Size?: number): TeamSuggestion {
  // Determine team sizes if not provided
  let actualTeam1Size: number, actualTeam2Size: number;

  if (team1Size && team2Size) {
    actualTeam1Size = team1Size;
    actualTeam2Size = team2Size;
  } else if (availablePlayers.length === 4) {
    actualTeam1Size = 2;
    actualTeam2Size = 2;
  } else if (availablePlayers.length === 5) {
    actualTeam1Size = 2;
    actualTeam2Size = 3;
  } else {
    const playersPerTeam = Math.floor(availablePlayers.length / 2);
    actualTeam1Size = playersPerTeam;
    actualTeam2Size = availablePlayers.length - playersPerTeam;
  }

  // Fallback: create balanced teams based on win percentage using snake draft
  const sortedPlayers = [...availablePlayers].sort((a, b) => b.winPercentage - a.winPercentage);
  const teamOne = [];
  const teamTwo = [];

  // Snake draft pattern for better balance
  let pickForTeamOne = true;
  for (let i = 0; i < availablePlayers.length; i++) {
    if (pickForTeamOne && teamOne.length < actualTeam1Size) {
      teamOne.push(sortedPlayers[i]);
    } else if (!pickForTeamOne && teamTwo.length < actualTeam2Size) {
      teamTwo.push(sortedPlayers[i]);
    } else if (teamOne.length < actualTeam1Size) {
      teamOne.push(sortedPlayers[i]);
    } else {
      teamTwo.push(sortedPlayers[i]);
    }

    // Alternate picks when both teams can still pick
    if (teamOne.length < actualTeam1Size && teamTwo.length < actualTeam2Size) {
      pickForTeamOne = !pickForTeamOne;
    }
  }

  return {
    scenario: "Fallback: Snake Draft Selection",
    teamOne,
    teamTwo,
    balanceScore: 50,
    expectedWinProbability: 50,
    reasoning: `Balanced teams created using snake draft: ${actualTeam1Size}v${actualTeam2Size} formation`
  };
}

export async function queryWallyballRules(query: string): Promise<string> {
  try {
    const relevantRules = await searchWallyballRules(query);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Wallyball rules expert with access to the official Wallyball Rules 2012 document. 

Relevant rules section:
${relevantRules}

Guidelines:
- Provide accurate information based on the official rules
- If the specific rule isn't found in the provided section, indicate this
- Be clear and concise in your explanations
- Reference specific rule numbers when available
- Explain the reasoning behind rules when helpful`
        },
        {
          role: "user",
          content: query
        }
      ],
      max_tokens: 400,
    });

    return response.choices[0].message.content || "Unable to find information about that rule.";
  } catch (error) {
    console.error('Error querying Wallyball rules:', error);
    return "I'm having trouble accessing the rules document right now. Please try again.";
  }
}

export async function generateMatchAnalysis(
  teamOne: PlayerStats[],
  teamTwo: PlayerStats[],
  context?: string
): Promise<string> {
  try {
    const team1Summary = teamOne.map(p => ({
      name: p.name,
      winPercentage: p.winPercentage,
      streak: p.streak
    }));

    const team2Summary = teamTwo.map(p => ({
      name: p.name,
      winPercentage: p.winPercentage,
      streak: p.streak
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a volleyball match analyst. Analyze the upcoming match between two teams and provide insights.

Team 1: ${JSON.stringify(team1Summary, null, 2)}
Team 2: ${JSON.stringify(team2Summary, null, 2)}

Provide:
- Match prediction and key factors
- Player matchups to watch
- Strategic considerations
- Expected competitiveness level`
        },
        {
          role: "user",
          content: context || "Analyze this upcoming match and provide insights."
        }
      ],
      max_tokens: 400,
    });

    return response.choices[0].message.content || "Unable to analyze match data.";
  } catch (error) {
    console.error('Error generating match analysis:', error);
    return "I'm having trouble analyzing the match data right now. Please try again.";
  }
}