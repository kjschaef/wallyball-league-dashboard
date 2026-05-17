import { NextRequest } from 'next/server';
import { POST } from '@/app/api/feedback/route';

describe('/api/feedback POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('rejects when feedbackText is missing', async () => {
    const mockRequest = {
      json: async () => ({
        messageIndex: 0,
        feedbackType: 'positive',
        chatTranscript: []
      })
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Feedback text is required' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it('rejects when feedbackText is just whitespace', async () => {
    const mockRequest = {
      json: async () => ({
        messageIndex: 0,
        feedbackType: 'positive',
        feedbackText: '   \n  ',
        chatTranscript: []
      })
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Feedback text is required' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it('accepts valid negative feedback and formats transcript correctly', async () => {
    const mockRequest = {
      json: async () => ({
        messageIndex: 1,
        feedbackType: 'negative',
        feedbackText: 'This answer is incorrect.',
        chatTranscript: [
          { role: 'user', content: 'What is the score?', timestamp: '2026-01-01T12:00:00.000Z' },
          { role: 'assistant', content: 'The score is 5-5.', timestamp: '2026-01-01T12:00:01.000Z' },
        ]
      })
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'Feedback submitted successfully'
    });

    // Check that console.log was called with the correct formatted text
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('FEEDBACK TYPE: Needs Improvement'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('MESSAGE INDEX: 1'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('This answer is incorrect.'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('USER: What is the score?'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ASSISTANT: The score is 5-5. <-- FEEDBACK FOR THIS MESSAGE'));
  });

  it('accepts valid positive feedback', async () => {
    const mockRequest = {
      json: async () => ({
        messageIndex: 0,
        feedbackType: 'positive',
        feedbackText: 'Great!',
        chatTranscript: [
          { role: 'assistant', content: 'Hello', timestamp: '2026-01-01T12:00:00.000Z' },
        ]
      })
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'Feedback submitted successfully'
    });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('FEEDBACK TYPE: Positive'));
  });

  it('handles JSON parsing errors gracefully', async () => {
    const mockRequest = {
      json: async () => { throw new Error('Invalid JSON'); }
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Failed to submit feedback',
      details: 'Invalid JSON'
    });

    // Check that console.error logged the failure
    expect(console.error).toHaveBeenCalledWith('Error submitting feedback:', expect.any(Error));
  });
});
