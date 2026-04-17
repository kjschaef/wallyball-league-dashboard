import { NextRequest, NextResponse } from 'next/server';

interface FeedbackRequest {
  messageIndex: number;
  feedbackType: 'positive' | 'negative';
  feedbackText: string;
  chatTranscript: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    type?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { messageIndex, feedbackType, feedbackText, chatTranscript }: FeedbackRequest = await request.json();

    if (!feedbackText?.trim()) {
      return NextResponse.json(
        { error: 'Feedback text is required' },
        { status: 400 }
      );
    }

    // Format chat transcript for logging
    const formattedTranscript = chatTranscript.map((msg, index) => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const indicator = index === messageIndex ? ' <-- FEEDBACK FOR THIS MESSAGE' : '';
      return `[${timestamp}] ${msg.role.toUpperCase()}: ${msg.content}${indicator}`;
    }).join('\n\n');

    console.log(`
New feedback received for the Volleyball Chat Assistant:

FEEDBACK TYPE: ${feedbackType === 'positive' ? 'Positive' : 'Needs Improvement'}
MESSAGE INDEX: ${messageIndex}

FEEDBACK:
${feedbackText}

CHAT TRANSCRIPT:
${formattedTranscript}
    `);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
