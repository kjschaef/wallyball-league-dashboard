import { NextRequest, NextResponse } from 'next/server';
import { analyzeMatchResultsImage, findPlayersInImage, analyzeMatchesWithConfirmedPlayers } from '../../../lib/openai';

export async function POST(request: NextRequest) {
  try {
    console.log('Image analysis request received.');
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const playerNamesStr = formData.get('playerNames') as string;
    const confirmedPlayersStr = formData.get('confirmedPlayers') as string;
    const step = formData.get('step') as string || '1';

    if (!image) {
      console.log('No image found in request.');
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    console.log('Image received:', image.name, 'Step:', step);

    let playerNames: string[] = [];
    let confirmedPlayers: string[] = [];
    
    try {
      playerNames = playerNamesStr ? JSON.parse(playerNamesStr) : [];
      confirmedPlayers = confirmedPlayersStr ? JSON.parse(confirmedPlayersStr) : [];
      console.log('Player names received:', playerNames);
      console.log('Confirmed players received:', confirmedPlayers);
    } catch (error) {
      console.error('Failed to parse player names:', error);
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    
    if (step === '1') {
      // Step 1: Find players and handle ambiguity
      console.log('Step 1: Finding players in image...');
      const playerFindings = await findPlayersInImage(imageBuffer, playerNames);
      console.log('Player findings complete:', playerFindings);

      if (playerFindings.ambiguousLetters && playerFindings.ambiguousLetters.length > 0) {
        return NextResponse.json({
          response: 'I found some letters that could match multiple players. Please help me identify them:',
          type: 'player_disambiguation',
          timestamp: new Date().toISOString(),
          additionalData: playerFindings,
        });
      } else {
        // No ambiguity, proceed directly to step 2
        const finalPlayerNames = Object.values(playerFindings.playerAssignments || {})
          .filter((name): name is string => typeof name === 'string' && !!name && !name.startsWith('?'));
        console.log('No ambiguity, proceeding to match analysis with players:', finalPlayerNames);
        const matchResults = await analyzeMatchesWithConfirmedPlayers(imageBuffer, finalPlayerNames);
        console.log('Match analysis complete:', matchResults);

        return NextResponse.json({
          response: 'Here are the match results I found based on the whiteboard:',
          type: 'match_results',
          timestamp: new Date().toISOString(),
          additionalData: matchResults,
        });
      }
    } else if (step === '2') {
      // Step 2: Analyze matches with confirmed players
      console.log('Step 2: Analyzing matches with confirmed players...');
      const matchResults = await analyzeMatchesWithConfirmedPlayers(imageBuffer, confirmedPlayers);
      console.log('Match analysis complete:', matchResults);

      return NextResponse.json({
        response: 'Here are the match results I found based on the whiteboard:',
        type: 'match_results',
        timestamp: new Date().toISOString(),
        additionalData: matchResults,
      });
    } else {
      // Fallback to original single-step process if needed
      console.log('Fallback: Using original single-step analysis...');
      const teamGroupings = await analyzeMatchResultsImage(imageBuffer, playerNames);
      console.log('Image analysis complete:', teamGroupings);

      return NextResponse.json({
        response: 'Here are the match results I found based on the whiteboard:',
        type: 'match_results',
        timestamp: new Date().toISOString(),
        additionalData: teamGroupings,
      });
    }
  } catch (error) {
    console.error('Image analysis API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process image',
        response: 'I apologize, but I encountered an error processing your image. Please try again.',
        type: 'error',
      },
      { status: 500 }
    );
  }
}
