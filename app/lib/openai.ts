import OpenAI from "openai";
import { WallyballRulesMCPServer } from '../../lib/mcp-server';

// Using GPT-4.1 for all OpenAI API calls
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
      model: "gpt-4.1",
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
      max_tokens: 500
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
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a volleyball team formation expert. Create balanced team matchups from available players.

Available players (${availablePlayers.length} total): ${JSON.stringify(playerSummary, null, 2)}

MCP Performance Analysis:
${mcpAnalysis}

CRITICAL REQUIREMENTS:
- Team 1 must have exactly ${team1Size} players
- Team 2 must have exactly ${team2Size} players
- Each player can only be on ONE team (absolutely NO duplicates between teams)
- Use ALL ${availablePlayers.length} available players across both teams
- NEVER put the same player on both teams
- Each player ID should appear exactly once across all teams

Team Formation Goals:
1. Balance skill levels for competitive matches
2. Consider current streaks, performance trends, and inactivity penalties
3. Aim for matches where either team could realistically win
4. Create unique team combinations (avoid same players together repeatedly)
5. Provide a balance score (0-100, where 50 is perfectly balanced)
6. Estimate win probability for team one

IMPORTANT: Return 3 different team scenarios that use DIFFERENT combinations of players. 
Do NOT suggest the same team composition with players in different orders.
Do NOT suggest the same team more than once.

Respond in JSON format:
{
  "matchups": [
    {
      "scenario": "Primary: Most Balanced",
      "teamOne": ["player1", "player2"],
      "teamTwo": ["player3", "player4"],
      "balanceScore": 75,
      "expectedWinProbability": 52,
      "reasoning": "Brief explanation of team formation logic"
    },
    {
      "scenario": "Alternative: Streak-Based", 
      "teamOne": ["player2", "player3"],
      "teamTwo": ["player1", "player4"],
      "balanceScore": 68,
      "expectedWinProbability": 48,
      "reasoning": "Teams formed considering current streaks"
    },
    {
      "scenario": "Variant: Mixed Experience",
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
          content: `Create 3 UNIQUE balanced team matchup scenarios from these ${availablePlayers.length} players. Team 1 needs ${team1Size} players, Team 2 needs ${team2Size} players. 

CRITICAL: 
- NO player can appear on both teams in any scenario
- Each scenario must use DIFFERENT team combinations (not just reordering the same players)
- If you suggest Player A and Player B together on Team 1 in scenario 1, don't suggest them together again in scenarios 2 or 3`
        }
      ],
      response_format: { type: "json_object" }
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
      model: "gpt-4.1",
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
      max_tokens: 400
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
      model: "gpt-4.1",
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
      max_tokens: 400
    });

    return response.choices[0].message.content || "Unable to analyze match data.";
  } catch (error) {
    console.error('Error generating match analysis:', error);
    return "I'm having trouble analyzing the match data right now. Please try again.";
  }
}

export async function findPlayersInImage(imageBuffer: Buffer, playerNames: string[]): Promise<any> {
  try {
    const playerContext = playerNames.length > 0
      ? `\n\nAvailable player names and their first letters:\n${playerNames.map(name => `${name} (${name.charAt(0).toUpperCase()})`).join('\n')}`
      : '';

    const promptText = `Analyze the attached image of a whiteboard with wallyball match results.

Your ONLY task is to find ALL unique letters that appear on the whiteboard as player initials.

Step-by-step process:
1. SCAN the entire whiteboard systematically from top to bottom
2. Look for ALL letters that appear to represent players (usually grouped together as teams)
3. IGNORE any letters that are clearly labels, titles, or other text
4. Focus ONLY on letters that appear to be player initials in team groupings

MAPPING PROCESS - For each letter found:
1. Check if exactly ONE player starts with that letter → assign directly (e.g., "N" → "Nate")
2. If MULTIPLE players start with that letter → mark as ambiguous (e.g., "P" → "?P") 
3. If NO players start with that letter → mark as unknown

${playerContext}

MAPPING EXAMPLES:
- If you find "N" and only "Nate" starts with N → "N": "Nate"
- If you find "M" and only "Mark" starts with M → "M": "Mark"  
- If you find "P" and both "Paul" and "Parker" start with P → "P": "?P"
- If you find "X" and no players start with X → "X": "UNKNOWN"

CRITICAL: Every letter found must appear in playerAssignments, even if unknown.

Return in this JSON format:
{
  "lettersFound": ["A", "B", "M", "K", "P", "N"],
  "playerAssignments": {
    "A": "Alice",
    "B": "Bob", 
    "M": "Mark",
    "K": "Keith",
    "P": "?P",
    "N": "Nate"
  },
  "ambiguousLetters": [
    {
      "letter": "P",
      "possiblePlayers": ["Paul", "Parker"]
    }
  ],
  "unknownLetters": []
}

VALIDATION CHECKLIST:
✓ Every letter in lettersFound appears in playerAssignments
✓ Direct assignments use actual player names (e.g., "Nate", not "?N")  
✓ Ambiguous letters use "?" prefix (e.g., "?P")
✓ Unknown letters use "UNKNOWN"

CRITICAL: Only focus on finding letters - do NOT try to identify teams or count tally marks yet.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are a precise image analysis expert focused on letter identification. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: {
                "url": `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.log('JSON Parse Error in findPlayersInImage:', parseError);
        console.log('Content:', content);
        return { error: "Could not parse player letters from the image." };
      }
    } else {
      return { error: "Could not extract player letters from the image." };
    }
  } catch (error) {
    console.error('Error finding players in image:', error);
    return { error: "I'm having trouble finding players in the image right now." };
  }
}

export async function analyzeMatchesWithConfirmedPlayers(imageBuffer: Buffer, confirmedPlayerNames: string[]): Promise<any> {
  try {
    const playerContext = `\n\nConfirmed player names:\n${confirmedPlayerNames.join('\n')}`;

    const promptText = `Analyze the attached image of a whiteboard with wallyball match results.

Your task is to find ALL matches and their results using the confirmed player names provided.

${playerContext}

Step-by-step process:
1. COMPREHENSIVE MATCH SCAN - Find ALL matches:
   - Scan entire whiteboard from top to bottom systematically
   - Look for every horizontal line with letter groupings that represent teams
   - Each distinct horizontal grouping is a separate match
   - Don't stop at 2-3 matches - keep scanning until entire image is covered

2. TEAM IDENTIFICATION - For each match:
   - Map the letters you see to the confirmed player names provided
   - Group the players into Team 1 and Team 2 based on their positioning

3. TALLY COUNTING - For each team:
   - Look below each team for OBVIOUS vertical marks only (|, ||, |||, etc.)
   - If tally marks are clear: count them accurately
   - If tally marks are unclear/faint/questionable: set wins to 0
   - Be conservative - only count marks you're confident about

Return in this JSON format:
{
  "matches": [
    {
      "matchNumber": 1,
      "teamOne": {
        "players": ["Mark", "Keith"],
        "letters": ["M", "K"],
        "wins": 3,
        "needsClarification": false
      },
      "teamTwo": {
        "players": ["Alice", "Bob"], 
        "letters": ["A", "B"],
        "wins": 2,
        "needsClarification": false
      }
    },
    {
      "matchNumber": 2,
      "teamOne": {
        "players": ["David", "Luke"],
        "letters": ["D", "L"],
        "wins": 0,
        "needsClarification": false
      },
      "teamTwo": {
        "players": ["Sarah", "Tom"],
        "letters": ["S", "T"],
        "wins": 0,
        "needsClarification": false
      }
    }
  ]
}

IMPORTANT: For each team, include:
- players: full player names
- letters: first letter of each player name (same order as players)
- wins: number of wins counted
- needsClarification: always false since players are confirmed

CRITICAL: Focus on accuracy over completeness for tally marks. If unsure about tallies, use 0.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are a precise match analysis expert. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: {
                "url": `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
              },
            },
          ],
        },
      ],
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.log('JSON Parse Error in analyzeMatchesWithConfirmedPlayers:', parseError);
        console.log('Content:', content);
        return { error: "Could not parse match results from the image." };
      }
    } else {
      return { error: "Could not extract match results from the image." };
    }
  } catch (error) {
    console.error('Error analyzing matches with confirmed players:', error);
    return { error: "I'm having trouble analyzing the matches right now." };
  }
}

export async function analyzeMatchResultsImage(imageBuffer: Buffer, playerNames?: string[]): Promise<any> {
  try {
    // Create player names context
    let playerContext = '';
    
    if (playerNames && playerNames.length > 0) {
      playerContext = `\n\nAvailable player names and their first letters:\n${playerNames.map(name => `${name} (${name.charAt(0).toUpperCase()})`).join('\n')}`;
    }

    const promptText = playerNames && playerNames.length > 0
      ? `Analyze the attached image of a whiteboard with wallyball match results. The whiteboard shows:
1. Each horizontal line represents ONE MATCH between two teams
2. First letters of player names grouped together to indicate teams
3. Tally marks below teams indicate wins for each team

PRIMARY GOAL: Find ALL matches on the whiteboard
- Scan the entire image systematically from top to bottom
- Look for every horizontal line that has team groupings
- Each line with letters grouped as "Team vs Team" is a match
- Don't miss any matches - be thorough in your scan, the handwriting may be messy
- Determine the correct player names based on the first letters shown

SECONDARY GOAL: Count tally marks
- Only count OBVIOUS vertical counting marks like |, ||, |||
- If tally marks are unclear, faint, or ambiguous, set wins to 0
- Focus accuracy over completeness for tally marks

TALLY MARK RULES:
- Must be clearly intentional vertical lines or tick marks
- When in doubt, use 0 wins for that team

Extract ALL matches found, with conservative tally counting. 

Step-by-step process:
1. COMPREHENSIVE MATCH SCAN - Find ALL matches:
   - Scan entire whiteboard from top to bottom systematically
   - Look for every horizontal line with letter groupings
   - Don't stop at 2-3 matches - keep scanning until entire image is covered
   - Each distinct horizontal grouping is a separate match

2. PLAYER ASSIGNMENT - For EACH letter found across ALL matches:
   - First, identify ALL letters that appear in the whiteboard image
   - For each letter found in the image, check if multiple players share that first letter
   - ONLY flag letters as ambiguous if BOTH conditions are true:
     - Letter is visible in the whiteboard image
     - Multiple available players have that same first letter
   - If a letter appears in image but only one player matches, directly assign that player
   - Completely ignore any players whose first letters don't appear in the image
   - Example:
      - M: Count players starting with M → Mark (1 player) → DIRECT ASSIGNMENT
      - P: Count players starting with P → Paul, Parker (2 players) → AMBIGUOUS
      - J: Count players starting with J → John (1 player) → DIRECT ASSIGNMENT
      - A: Count players starting with A → Alice, Amy (2 players) → AMBIGUOUS
      - Continue for every letter found in the image

3. TALLY COUNTING - For each match:
   - Look below each team for OBVIOUS vertical marks only
   - If tally marks are clear: count them
   - If tally marks are unclear/faint/questionable: use the count of clear marks
   - If no clear tallies, set wins to 0 for that team

4. VALIDATION:
   - Verify all matches found
   - Only include letters in ambiguousLetters if 2+ players match
   - Use actual names for single-match letters

CRITICAL PLAYER NAME FORMATTING RULES:
- ONLY use "?X" format when letter X has 2+ possible players (e.g., "?P" when both Paul and Parker exist)
- ALWAYS use actual player name when letter has exactly 1 match (e.g., "Mark" not "?M")
- NEVER use ? prefix unless multiple players share that first letter

EXAMPLES OF CORRECT FORMATTING:
- Letter M with only Mark available → Use "Mark" (NOT "?M")
- Letter P with Paul and Parker available → Use "?P" (ambiguous)
- Letter K with only Keith available → Use "Keith" (NOT "?K")

${playerContext}

Return in this JSON format:

EXAMPLE 1 - WITH ambiguity (letter P has multiple matches):
{
  "hasAmbiguity": true,
  "ambiguousLetters": [
    {
      "letter": "P",
      "possiblePlayers": ["Paul", "Parker"]
    }
  ],
  "matches": [
    {
      "matchNumber": 1,
      "teamOne": {
        "players": ["?P", "Keith"],
        "letters": ["P", "K"],
        "wins": 3,
        "needsClarification": true
      },
      "teamTwo": {
        "players": ["Bob", "John"],
        "letters": ["B", "J"],
        "wins": 2,
        "needsClarification": false
      }
    }
  ]
}

Note: P uses "?P" because Paul/Parker both match. K uses "Keith" directly because only Keith matches K.
The wins count represents ONLY clear, intentional tally marks found below each team.
If no clear tallies are visible, use 0 for wins.

EXAMPLE 2 - Multiple matches found (scan entire whiteboard):
{
  "hasAmbiguity": false,
  "ambiguousLetters": [],
  "matches": [
    {
      "matchNumber": 1,
      "teamOne": {
        "players": ["Mark", "Keith"],
        "letters": ["M", "K"],
        "wins": 0,
        "needsClarification": false
      },
      "teamTwo": {
        "players": ["Alice", "Bob"],
        "letters": ["A", "B"],
        "wins": 0,
        "needsClarification": false
      }
    },
    {
      "matchNumber": 2,
      "teamOne": {
        "players": ["David", "Luke"],
        "letters": ["D", "L"],
        "wins": 3,
        "needsClarification": false
      },
      "teamTwo": {
        "players": ["Sarah", "Tom"],
        "letters": ["S", "T"],
        "wins": 2,
        "needsClarification": false
      }
    },
    {
      "matchNumber": 3,
      "teamOne": {
        "players": ["Rachel", "Jim"],
        "letters": ["R", "J"],
        "wins": 0,
        "needsClarification": false
      },
      "teamTwo": {
        "players": ["Nancy", "Paul"],
        "letters": ["N", "P"],
        "wins": 0,
        "needsClarification": false
      }
    },
    {
      "matchNumber": 4,
      "teamOne": {
        "players": ["Zoe", "Ian"],
        "letters": ["Z", "I"],
        "wins": 1,
        "needsClarification": false
      },
      "teamTwo": {
        "players": ["Emma", "Greg"],
        "letters": ["E", "G"],
        "wins": 4,
        "needsClarification": false
      }
    }
  ]
}

Note: This example shows finding 4 matches by scanning the entire whiteboard.
Many teams have 0 wins due to conservative tally counting - only clear tallies are counted.

FINAL VALIDATION:
1. Check every player name in your response
2. Remove ? prefix from any unambiguous player letters
3. Only letters with 2+ matches should be in ambiguousLetters array
   - Example: If only Mark starts with M, use "Mark" not "?M"

REMEMBER: Only put letters in ambiguousLetters if 2+ players share that first letter and the letter is found in the image!`
      : 'Analyze the attached image of a whiteboard with wallyball match results. Extract the player names, teams, and game wins for each match. Return the data in a JSON format.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are a precise image analysis expert. Always respond with valid JSON only. Do not include any text before or after the JSON object.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText + '\n\nIMPORTANT: Return only valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.' },
            {
              type: 'image_url',
              image_url: {
                "url": `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.log('JSON Parse Error:', parseError);
        console.log('Content that failed to parse:', content);
        return { 
          error: "Could not parse team groupings from the image.", 
          rawResponse: content.substring(0, 500)
        };
      }
    } else {
      return { error: "Could not extract team groupings from the image." };
    }
  } catch (error) {
    console.error('Error analyzing team groupings image:', error);
    return { error: "I'm having trouble analyzing the image right now. Please try again." };
  }
}