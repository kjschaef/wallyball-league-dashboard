import { NextRequest, NextResponse } from 'next/server';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

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

    // Check if Mailgun credentials are configured
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      console.error('Mailgun credentials not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Create Mailgun client
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
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
    try {
      const sendResult = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        from: `Volleyball Assistant <noreply@${process.env.MAILGUN_DOMAIN}>`,
        to: ['schaefer.keith@gmail.com'],
        subject: emailSubject,
        text: emailBody
      });
      console.log("Email sent successfully:", sendResult);
    } catch (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email using Mailgun',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

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