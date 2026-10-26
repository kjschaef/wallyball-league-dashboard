import sharp from 'sharp';
import { createChatCompletion } from './modelClient';
import { whiteboardAnalysisSystemPrompt } from './prompts';

/**
 * Normalize an uploaded whiteboard image into a clean, auto-oriented JPEG
 * buffer (capped at 2048px on the longest edge) so OpenAI vision receives a
 * guaranteed valid `image/jpeg` payload regardless of the source format
 * (PNG, WebP, GIF, or high-resolution camera JPEG). Falls back to the raw
 * buffer if `sharp` cannot decode the input (e.g. synthetic test buffers).
 */
export async function prepareVisionJpegBuffer(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .rotate()
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    return imageBuffer;
  }
}

/**
 * Whiteboard photo parsing for the NEW board format.
 *
 * This is intentionally separate from the legacy initials + tally-marks
 * prompts (findPlayersInImage / analyzeMatchesWithConfirmedPlayers). The
 * boards players actually photograph now list full first names with
 * per-game numeric scores, and the circled score marks that game's winner.
 * Pointing the old prompts at this format misreads it, so this function
 * has its own prompt tuned to what is on the board.
 *
 * The model returns raw readings only. Roster matching, flagging, and
 * validation all happen in app/lib/whiteboard.ts, and nothing is logged
 * until the user confirms the parsed matches in the chat UI.
 */
export async function analyzeWhiteboardScores(imageBuffer: Buffer, rosterNames?: string[]): Promise<any> {
  try {
    const normalizedBuffer = await prepareVisionJpegBuffer(imageBuffer);
    const rosterContext =
      rosterNames && rosterNames.length > 0
        ? `\nKNOWN LEAGUE ROSTER (use as a handwriting spelling reference only — never force an unrelated name onto what is written, and transcribe unknown players as written):\n${rosterNames.join(', ')}\n`
        : '';

    const promptText = `Analyze the attached photo of a whiteboard with wallyball match results.

THE BOARD FORMAT (read this carefully — it is NOT initials and tally marks):
- Each match is TWO lines of handwritten FIRST NAMES (teams of 3 players),
  separated by "/" or ",". Example: "Nate / Ben / Keith" or "Nate, Vamsi, Seth".
- Matches are separated by horizontal lines drawn across the board.
- To the right of each team line are that team's per-game scores,
  comma-separated. Example: "5, 11, 11".
- A CIRCLED number is the winning score of that game. The circle marks the
  winner — it is not decoration.
- Pair scores by position: the 1st score on team one's line vs the 1st score
  on team two's line is game 1, the 2nd vs the 2nd is game 2, and so on.
- A team pairing with NO scores next to it has NOT been played yet. Report
  it with played: false and games: [] — NEVER invent scores for it.
- Ignore printed flyers, posters, and headers taped above the board. Only
  read the handwriting on the whiteboard itself.
- Player names are first names only. Transcribe them as written; if a name is
  clearly a messy handwritten version of a name on the known league roster,
  use the canonical capitalization, otherwise transcribe it verbatim.
${rosterContext}
Return in this JSON format:
{
  "matches": [
    {
      "matchNumber": 1,
      "teamOne": { "players": ["Nate", "Ben", "Keith"] },
      "teamTwo": { "players": ["Hal", "Mark", "Vamsi"] },
      "games": [
        { "teamOneScore": 5, "teamTwoScore": 11 },
        { "teamOneScore": 11, "teamTwoScore": 6 },
        { "teamOneScore": 11, "teamTwoScore": 7 }
      ],
      "played": true
    },
    {
      "matchNumber": 2,
      "teamOne": { "players": ["Nate", "Keith", "Seth"] },
      "teamTwo": { "players": ["Hal", "Vamsi", "Zach"] },
      "games": [],
      "played": false
    }
  ]
}

VALIDATION CHECKLIST (re-read the photo until all of these hold):
- Every game has exactly one winner (the two scores differ). If a pair
  looks tied, you misread a digit — look again.
- In every pair, the circled score is the larger score. If it is not,
  you misread the pair — look again.
- played: false entries always have games: [].
- Do not drop a match because its scores are hard to read: include it with
  your best reading and let the user correct it — but never invent a score
  for a team pairing that has no scores at all.`;

    const visionModel = process.env.OPENAI_VISION_MODEL || 'gpt-5.4';

    const response = await createChatCompletion({
      model: visionModel,
      messages: [
        {
          role: 'system',
          content: whiteboardAnalysisSystemPrompt()
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${normalizedBuffer.toString('base64')}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_completion_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('JSON Parse Error in analyzeWhiteboardScores:', parseError);
        return { error: 'Could not parse whiteboard scores from the image.' };
      }
    }
    return { error: 'Could not extract whiteboard scores from the image.' };
  } catch (error) {
    console.error('Error analyzing whiteboard scores:', error);
    return { error: "I'm having trouble reading that whiteboard photo right now. Please try again." };
  }
}
