import { POST } from '@/app/api/feedback/route';

describe('/api/feedback POST', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods to keep test output clean and verify logging behavior
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('successfully processes valid positive feedback', async () => {
    // Arrange: Mock the request object with a valid feedback payload
    const mockRequest = {
      json: async () => ({
        messageIndex: 1,
        feedbackType: 'positive',
        feedbackText: 'Great response!',
        chatTranscript: [
          { role: 'user', content: 'Hello', timestamp: '2023-01-01T00:00:00Z' },
          { role: 'assistant', content: 'Hi there', timestamp: '2023-01-01T00:00:01Z' }
        ]
      })
    } as any;

    // Act: Call the POST handler
    const response = await POST(mockRequest);

    // Assert: Verify successful response and console logging
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      success: true,
      message: 'Feedback submitted successfully'
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    const logOutput = consoleLogSpy.mock.calls[0][0];
    expect(logOutput).toContain('FEEDBACK TYPE: Positive');
    expect(logOutput).toContain('MESSAGE INDEX: 1');
    expect(logOutput).toContain('Great response!');
    expect(logOutput).toContain('<-- FEEDBACK FOR THIS MESSAGE');
  });

  it('successfully processes valid negative feedback', async () => {
    // Arrange: Mock the request object with negative feedback
    const mockRequest = {
      json: async () => ({
        messageIndex: 0,
        feedbackType: 'negative',
        feedbackText: 'Not helpful',
        chatTranscript: [
          { role: 'assistant', content: 'Here is some info', timestamp: '2023-01-01T00:00:00Z' }
        ]
      })
    } as any;

    // Act: Call the POST handler
    const response = await POST(mockRequest);

    // Assert: Verify successful response and logging of negative feedback
    expect(response.status).toBe(200);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logOutput = consoleLogSpy.mock.calls[0][0];
    expect(logOutput).toContain('FEEDBACK TYPE: Needs Improvement');
  });

  it('returns 400 when feedback text is missing or only whitespace', async () => {
    // Arrange: Mock request with empty feedback text
    const mockRequest = {
      json: async () => ({
        messageIndex: 1,
        feedbackType: 'positive',
        feedbackText: '   ', // empty string
        chatTranscript: []
      })
    } as any;

    // Act: Call the POST handler
    const response = await POST(mockRequest);

    // Assert: Verify bad request response
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Feedback text is required' });

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('returns 500 when JSON parsing fails', async () => {
    // Arrange: Mock request that throws an error when parsing JSON
    const mockRequest = {
      json: async () => {
        throw new Error('Invalid JSON');
      }
    } as any;

    // Act: Call the POST handler
    const response = await POST(mockRequest);

    // Assert: Verify internal server error response
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to submit feedback');
    expect(data.details).toBe('Invalid JSON');

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
