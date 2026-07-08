import { NextRequest } from 'next/server';
import { POST } from '../../app/api/feedback/route';

// Helper to create a NextRequest mock
const createMockRequest = (body: any, rejectJson = false) => {
  return {
    json: jest.fn().mockImplementation(() => {
      if (rejectJson) {
        return Promise.reject(new Error('Invalid JSON'));
      }
      return Promise.resolve(body);
    }),
  } as unknown as NextRequest;
};

describe('POST /api/feedback', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  let mockConsoleLog: jest.Mock;
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    mockConsoleLog = jest.fn();
    mockConsoleError = jest.fn();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('returns 400 Bad Request when feedbackText is missing', async () => {
    const request = createMockRequest({
      messageIndex: 1,
      feedbackType: 'negative',
      chatTranscript: []
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Feedback text is required' });
  });

  it('returns 400 Bad Request when feedbackText is empty or just whitespace', async () => {
    const request = createMockRequest({
      messageIndex: 1,
      feedbackType: 'negative',
      feedbackText: '   ',
      chatTranscript: []
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Feedback text is required' });
  });

  it('processes feedback successfully and logs properly formatted output', async () => {
    const request = createMockRequest({
      messageIndex: 1,
      feedbackType: 'negative',
      feedbackText: 'This response was not helpful.',
      chatTranscript: [
        {
          role: 'user',
          content: 'Hello',
          timestamp: '2023-10-25T10:00:00Z'
        },
        {
          role: 'assistant',
          content: 'How can I help?',
          timestamp: '2023-10-25T10:00:05Z'
        }
      ]
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, message: 'Feedback submitted successfully' });

    // Verify logging format
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    const logOutput = mockConsoleLog.mock.calls[0][0];

    expect(logOutput).toContain('FEEDBACK TYPE: Needs Improvement');
    expect(logOutput).toContain('MESSAGE INDEX: 1');
    expect(logOutput).toContain('This response was not helpful.');
    expect(logOutput).toContain('USER: Hello');
    expect(logOutput).toContain('ASSISTANT: How can I help? <-- FEEDBACK FOR THIS MESSAGE');
  });

  it('processes positive feedback correctly', async () => {
    const request = createMockRequest({
      messageIndex: 0,
      feedbackType: 'positive',
      feedbackText: 'Great answer!',
      chatTranscript: [
        {
          role: 'assistant',
          content: 'I am a helpful assistant.',
          timestamp: '2023-10-25T10:00:00Z'
        }
      ]
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    const logOutput = mockConsoleLog.mock.calls[0][0];
    expect(logOutput).toContain('FEEDBACK TYPE: Positive');
  });

  it('returns 500 Internal Server Error when an exception occurs', async () => {
    const request = createMockRequest(null, true);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to submit feedback'
    });

    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith('Error submitting feedback:', expect.any(Error));
  });

  it('returns 500 and handles unknown errors properly', async () => {
    // Rejects with a non-Error string to test the "Unknown error" fallback
    const request = createMockRequest(null, false);
    // Let's override json manually for this test specifically
    request.json = jest.fn().mockRejectedValue('Some weird string error');

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to submit feedback'
    });

    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith('Error submitting feedback:', 'Some weird string error');
  });
});
