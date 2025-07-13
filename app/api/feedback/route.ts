
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use App Password for Gmail
      }
    });

    // Format chat transcript for email
    const formattedTranscript = chatTranscript.map((msg, index) => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const indicator = index === messageIndex ? ' <-- FEEDBACK FOR THIS MESSAGE' : '';
      return `[${timestamp}] ${msg.role.toUpperCase()}: ${msg.content}${indicator}`;
    }).join('\n\n');

    // Email content
    const emailSubject = `Volleyball Chat Assistant Feedback - ${feedbackType === 'positive' ? 'Positive' : 'Improvement'}`;
    const emailBody = `
New feedback received for the Volleyball Chat Assistant:

FEEDBACK TYPE: ${feedbackType === 'positive' ? 'Positive' : 'Needs Improvement'}
MESSAGE INDEX: ${messageIndex}

FEEDBACK:
${feedbackText}

CHAT TRANSCRIPT:
${formattedTranscript}

---
Sent from Volleyball Team Assistant
Timestamp: ${new Date().toISOString()}
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'schaefer.keith@gmail.com',
      subject: emailSubject,
      text: emailBody
    });

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
