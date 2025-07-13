import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

    // Check if AWS SES credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      console.error('AWS SES credentials not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Create SES client
    const sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
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
    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: ['schaefer.keith@gmail.com'],
      },
      Message: {
        Body: {
          Text: {
            Data: emailBody,
          },
        },
        Subject: {
          Data: emailSubject,
        },
      },
      Source: 'schaefer.keith@gmail.com', // Replace with your verified SES email
    });

    try {
      const sendResult = await sesClient.send(sendEmailCommand);
      console.log("Email sent successfully:", sendResult);
    } catch (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email using SES',
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