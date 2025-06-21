import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a volleyball performance analyst. Analyze player statistics and provide insights.
          
Current player data: ${JSON.stringify(playerSummary, null, 2)}

Guidelines:
- Focus on win percentages, streaks, and recent performance
- Consider inactivity penalties in your analysis
- Provide specific, actionable insights
- Be concise but informative
- Use volleyball terminology appropriately`
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
  availablePlayers: PlayerStats[],
  teamSize: number = 3
): Promise<TeamSuggestion> {
  try {
    if (availablePlayers.length < teamSize * 2) {
      throw new Error(`Need at least ${teamSize * 2} players for team suggestions`);
    }

    const playerSummary = availablePlayers.map(p => ({
      name: p.name,
      winPercentage: p.winPercentage,
      totalGames: p.record.totalGames,
      streak: p.streak,
      actualWinPercentage: p.actualWinPercentage || p.winPercentage
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a volleyball team formation expert. Create balanced team matchups from available players.

Available players: ${JSON.stringify(playerSummary, null, 2)}

Your task:
1. Form two teams of ${teamSize} players each
2. Balance skill levels for competitive matches
3. Consider current streaks and performance trends
4. Provide a balance score (0-100, where 50 is perfectly balanced)
5. Estimate win probability for team one

Respond in JSON format:
{
  "teamOne": ["player1", "player2", "player3"],
  "teamTwo": ["player4", "player5", "player6"],
  "balanceScore": 75,
  "expectedWinProbability": 52,
  "reasoning": "Detailed explanation of team formation logic"
}`
        },
        {
          role: "user",
          content: `Create balanced teams from these ${availablePlayers.length} players for a competitive match.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Map player names back to PlayerStats objects
    const teamOne = result.teamOne?.map((name: string) => 
      availablePlayers.find(p => p.name === name)
    ).filter(Boolean) || [];
    
    const teamTwo = result.teamTwo?.map((name: string) => 
      availablePlayers.find(p => p.name === name)
    ).filter(Boolean) || [];

    return {
      teamOne,
      teamTwo,
      balanceScore: result.balanceScore || 50,
      expectedWinProbability: result.expectedWinProbability || 50,
      reasoning: result.reasoning || "Team formation based on balanced skill levels"
    };
  } catch (error) {
    console.error('Error suggesting team matchups:', error);
    
    // Fallback: create balanced teams based on win percentage
    const sortedPlayers = [...availablePlayers].sort((a, b) => b.winPercentage - a.winPercentage);
    const teamOne = [];
    const teamTwo = [];
    
    for (let i = 0; i < teamSize * 2; i++) {
      if (i % 2 === 0) {
        teamOne.push(sortedPlayers[i]);
      } else {
        teamTwo.push(sortedPlayers[i]);
      }
    }

    return {
      teamOne,
      teamTwo,
      balanceScore: 50,
      expectedWinProbability: 50,
      reasoning: "Balanced teams created by alternating top performers"
    };
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