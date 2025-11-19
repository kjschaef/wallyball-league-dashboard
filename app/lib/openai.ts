import { WallyballRulesMCPServer } from '../../lib/mcp-server';
import { createChatCompletion } from './modelClient';
import {
  playerPerformanceSystemPrompt,
  teamMatchupsSystemPrompt,
  rulesSystemPrompt,
  matchAnalysisSystemPrompt,
  imageLettersSystemPrompt,
  imageAnalysisSystemPrompt
} from './prompts';

// Model client handles OpenAI initialization and model selection

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

import { PlayerStats, TeamSuggestion } from './types';
import { generateBalancedTeams } from './team-balancer';

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

    const response = await createChatCompletion({
      model: "gpt-5",
      temperature: 0.2,
      max_completion_tokens: 600,
      messages: [
        {
          role: "system",
          content: playerPerformanceSystemPrompt(playerSummary, rulesContext)
        },
        {
          role: "user",
          content: query
        }
      ]
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
    return generateBalancedTeams(availablePlayers);
  } catch (error) {
    console.error('Error suggesting team matchups:', error);
    return [];
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

    const response = await createChatCompletion({
      model: "gpt-5",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: rulesSystemPrompt(relevantRules)
        },
        {
          role: "user",
          content: query
        }
      ],
      max_completion_tokens: 400
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

    const response = await createChatCompletion({
      model: "gpt-5",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: matchAnalysisSystemPrompt(team1Summary, team2Summary)
        },
        {
          role: "user",
          content: context || "Analyze this upcoming match and provide insights."
        }
      ],
      max_completion_tokens: 400
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

    const response = await createChatCompletion({
      model: 'gpt-5',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: imageLettersSystemPrompt()
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
      max_completion_tokens: 500,
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

    const response = await createChatCompletion({
      model: 'gpt-5',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: imageAnalysisSystemPrompt()
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
      max_completion_tokens: 800,
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

    const response = await createChatCompletion({
      model: 'gpt-5',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: imageAnalysisSystemPrompt()
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
      max_completion_tokens: 1000,
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
