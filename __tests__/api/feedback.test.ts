import { NextRequest } from 'next/server';
import { POST } from '../../app/api/feedback/route';

describe('/api/feedback POST', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  };

  it('successfully processes valid feedback', async () => {
    const validPayload = {
      messageIndex: 1,
      feedbackType: 'positive',
      feedbackText: 'Great response!',
      chatTranscript: [
        { role: 'user', content: 'Hello', timestamp: '2024-03-20T10:00:00Z' },
        { role: 'assistant', content: 'Hi there', timestamp: '2024-03-20T10:00:05Z' }
      ]
    };

    const request = createMockRequest(validPayload);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      success: true,
      message: 'Feedback submitted successfully'
    });
    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0][0];
    expect(logCall).toContain('Positive');
    expect(logCall).toContain('Great response!');
    expect(logCall).toContain('<-- FEEDBACK FOR THIS MESSAGE');
  });

  it('successfully processes negative feedback', async () => {
    const validPayload = {
      messageIndex: 0,
      feedbackType: 'negative',
      feedbackText: 'Not helpful',
      chatTranscript: [
        { role: 'assistant', content: 'I do not know', timestamp: '2024-03-20T10:00:05Z' }
      ]
    };

    const request = createMockRequest(validPayload);
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0][0];
    expect(logCall).toContain('Needs Improvement');
    expect(logCall).toContain('Not helpful');
  });

  it('returns 400 when feedbackText is missing', async () => {
    const invalidPayload = {
      messageIndex: 1,
      feedbackType: 'positive',
      chatTranscript: []
    };

    const request = createMockRequest(invalidPayload);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Feedback text is required' });
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('returns 400 when feedbackText is empty or whitespace', async () => {
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
    expect(data).toEqual({ error: 'Feedback text is required' });
  });

  it('returns 500 when JSON parsing fails', async () => {
    const request = {
      json: async () => { throw new Error('Invalid JSON'); }
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to submit feedback');
    expect(data.details).toBe('Invalid JSON');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
