import { NextRequest } from 'next/server';
import { POST } from '../../app/api/feedback/route';

describe('Feedback API', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const createMockRequest = (bodyObj: any) => {
    return {
      json: async () => bodyObj,
    } as NextRequest;
  };

  const createMockRequestWithReject = () => {
    return {
      json: async () => Promise.reject(new Error('Invalid JSON')),
    } as NextRequest;
  };

  it('should handle successful feedback submission', async () => {
    const validPayload = {
      messageIndex: 1,
      feedbackType: 'positive',
      feedbackText: 'Great answer!',
      chatTranscript: [
        { role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Hi there', timestamp: new Date().toISOString() },
      ]
    };

    const request = createMockRequest(validPayload);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Feedback submitted successfully');

    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0][0];
    expect(logCall).toContain('New feedback received for the Volleyball Chat Assistant:');
    expect(logCall).toContain('FEEDBACK TYPE: Positive');
    expect(logCall).toContain('MESSAGE INDEX: 1');
    expect(logCall).toContain('Great answer!');
    expect(logCall).toContain('<-- FEEDBACK FOR THIS MESSAGE');
  });

  it('should return 400 Bad Request if feedbackText is missing', async () => {
    const invalidPayload = {
      messageIndex: 1,
      feedbackType: 'positive',
      chatTranscript: []
    };

    const request = createMockRequest(invalidPayload);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Feedback text is required');
  });

  it('should return 400 Bad Request if feedbackText is empty or just whitespace', async () => {
    const invalidPayload = {
      messageIndex: 1,
      feedbackType: 'positive',
      feedbackText: '   ',
      chatTranscript: []
    };

    const request = createMockRequest(invalidPayload);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Feedback text is required');
  });

  it('should return 500 Internal Server Error if request.json() fails', async () => {
    const request = createMockRequestWithReject();
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to submit feedback');
    expect(data.details).toBe('Invalid JSON');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting feedback:', expect.any(Error));
  });
});
