import { NextRequest, NextResponse } from 'next/server';
import { analyzeMatchResultsImage } from '../../../lib/openai';

export async function POST(request: NextRequest) {
  try {
    console.log('Image analysis request received.');
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      console.log('No image found in request.');
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    console.log('Image received:', image.name);

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    console.log('Analyzing image...');
    const matchResults = await analyzeMatchResultsImage(imageBuffer);
    console.log('Image analysis complete:', matchResults);

    return NextResponse.json({
      response: 'Here are the match results I found in the image:',
      type: 'match_results',
      timestamp: new Date().toISOString(),
      additionalData: matchResults,
    });
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
