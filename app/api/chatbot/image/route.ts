import { NextRequest, NextResponse } from 'next/server';
import { analyzeMatchResultsImage } from '../../../lib/openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const matchResults = await analyzeMatchResultsImage(imageBuffer);

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
