import { WallyballRulesRAG } from '../../lib/rag';
import { createChatCompletion } from './modelClient';
import {
  playerPerformanceSystemPrompt,
  rulesSystemPrompt,
  imageLettersSystemPrompt,
  imageAnalysisSystemPrompt,
  dailySummarySystemPrompt
} from './prompts';

// Model client handles OpenAI initialization and model selection

export async function generateDailySummary(
  matches: any[],
  playerStats: any[],
  seasonInfo?: { name: string; start_date: string; end_date: string }
): Promise<string> {
  try {
    const response = await createChatCompletion({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: dailySummarySystemPrompt(matches, playerStats, seasonInfo)
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
    console.log(`[detectIntent] Query: "${query}" -> Raw LLM response: "${content}"`);

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
    console.log(`[shouldConsultRules] Query: "${query}" -> Raw LLM response: "${content}"`);
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

    console.log('[analyzePlayerPerformance] First lifetime player raw:', JSON.stringify(lifetimePlayers[0], null, 2));
    console.log('[analyzePlayerPerformance] First lifetime summary:', JSON.stringify(lifetimeSummary[0], null, 2));

    // Check if the query is about rules and get context from RAG
    let rulesContext = '';
    let usedRules = false;

    const needsRules = await shouldConsultRules(query);
    console.log(`[analyzePlayerPerformance] needsRules: ${needsRules}`);

    if (needsRules) {
      const rulesResult = await searchWallyballRules(query);
      console.log(`[analyzePlayerPerformance] RAG search found ${rulesResult.usedRules ? 'results' : 'NO results'}`);
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

    console.log('[analyzePlayerPerformance] Response:', JSON.stringify(response, null, 2));

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

    console.log('[queryWallyballRules] Response:', JSON.stringify(response, null, 2));

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
      model: 'gpt-5-mini',
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
      max_completion_tokens: 2000,
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
      model: 'gpt-5-mini',
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
      max_completion_tokens: 2000,
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
      model: 'gpt-5-mini',
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
      max_completion_tokens: 2000,
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
