import { NextRequest } from 'next/server';
import { POST } from '../../app/api/chatbot/image/route';
import { resetChatbotRateLimit } from '@/app/lib/chatbotGuard';

const mockCookieStore = {
  get: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

const mockFindPlayersInImage = jest.fn();
const mockAnalyzeMatchesWithConfirmedPlayers = jest.fn();
const mockAnalyzeMatchResultsImage = jest.fn();

jest.mock('@/app/lib/openai', () => ({
  findPlayersInImage: (...args: unknown[]) => mockFindPlayersInImage(...args),
  analyzeMatchesWithConfirmedPlayers: (...args: unknown[]) => mockAnalyzeMatchesWithConfirmedPlayers(...args),
  analyzeMatchResultsImage: (...args: unknown[]) => mockAnalyzeMatchResultsImage(...args),
}));

const mockImageFile = {
  arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
} as unknown as File;

const createMockRequest = (
  formDataValues: Record<string, any>,
  rejectFormData = false,
  headers: Record<string, string> = {}
) => {
  return {
    headers: {
      get: (header: string) => headers[header.toLowerCase()] ?? null,
    },
    formData: jest.fn().mockImplementation(() => {
      if (rejectFormData) {
        return Promise.reject(new Error('Form data parsing failed'));
      }
      return Promise.resolve({
        get: (key: string) => formDataValues[key] !== undefined ? formDataValues[key] : null
      });
    }),
  } as unknown as NextRequest;
};

describe('POST /api/chatbot/image', () => {
  const originalConsoleError = console.error;
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    resetChatbotRateLimit();
    mockCookieStore.get.mockReturnValue({ value: 'true' });
    mockConsoleError = jest.fn();
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('returns 400 Bad Request when image is missing', async () => {
    const request = createMockRequest({
      playerNames: '["Alice", "Bob"]',
      step: '1'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Image is required' });
  });

  it('handles invalid playerNames or confirmedPlayers JSON string gracefully', async () => {
    mockFindPlayersInImage.mockResolvedValue({
      lettersFound: ['A'],
      playerAssignments: { 'A': 'Alice' },
      ambiguousLetters: [],
      unknownLetters: []
    });

    mockAnalyzeMatchesWithConfirmedPlayers.mockResolvedValue({
      matches: []
    });

    const request = createMockRequest({
      image: mockImageFile,
      playerNames: '{invalid-json}', // Syntax error during parse
      step: '1'
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockFindPlayersInImage).toHaveBeenCalledWith(expect.any(Buffer), []);
  });

  it('Step 1: returns player_disambiguation response when ambiguous letters exist', async () => {
    const findings = {
      lettersFound: ['A', 'B', 'P'],
      playerAssignments: { 'A': 'Alice', 'B': 'Bob', 'P': '?P' },
      ambiguousLetters: [
        { letter: 'P', possiblePlayers: ['Paul', 'Parker'] }
      ],
      unknownLetters: []
    };

    mockFindPlayersInImage.mockResolvedValue(findings);

    const request = createMockRequest({
      image: mockImageFile,
      playerNames: '["Alice", "Bob", "Paul", "Parker"]',
      step: '1'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('player_disambiguation');
    expect(data.response).toContain('identify them');
    expect(data.additionalData).toEqual(findings);
    expect(mockFindPlayersInImage).toHaveBeenCalledWith(expect.any(Buffer), ['Alice', 'Bob', 'Paul', 'Parker']);
    expect(mockAnalyzeMatchesWithConfirmedPlayers).not.toHaveBeenCalled();
  });

  it('Step 1: proceeds to analyze matches directly when no ambiguous letters exist', async () => {
    const findings = {
      lettersFound: ['A', 'B'],
      playerAssignments: { 'A': 'Alice', 'B': 'Bob' },
      ambiguousLetters: [],
      unknownLetters: []
    };

    const matchesResult = {
      matches: [
        {
          matchNumber: 1,
          teamOne: { players: ['Alice'], letters: ['A'], wins: 3, needsClarification: false },
          teamTwo: { players: ['Bob'], letters: ['B'], wins: 1, needsClarification: false }
        }
      ]
    };

    mockFindPlayersInImage.mockResolvedValue(findings);
    mockAnalyzeMatchesWithConfirmedPlayers.mockResolvedValue(matchesResult);

    const request = createMockRequest({
      image: mockImageFile,
      playerNames: '["Alice", "Bob"]',
      step: '1'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('match_results');
    expect(data.response).toContain('match results I found');
    expect(data.additionalData).toEqual(matchesResult);
    expect(mockAnalyzeMatchesWithConfirmedPlayers).toHaveBeenCalledWith(expect.any(Buffer), ['Alice', 'Bob']);
  });

  it('Step 2: analyzes matches with confirmed players directly', async () => {
    const matchesResult = {
      matches: [
        {
          matchNumber: 1,
          teamOne: { players: ['Paul'], letters: ['P'], wins: 3, needsClarification: false },
          teamTwo: { players: ['Bob'], letters: ['B'], wins: 1, needsClarification: false }
        }
      ]
    };

    mockAnalyzeMatchesWithConfirmedPlayers.mockResolvedValue(matchesResult);

    const request = createMockRequest({
      image: mockImageFile,
      confirmedPlayers: '["Paul", "Bob"]',
      step: '2'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('match_results');
    expect(data.response).toContain('match results');
    expect(data.additionalData).toEqual(matchesResult);
    expect(mockAnalyzeMatchesWithConfirmedPlayers).toHaveBeenCalledWith(expect.any(Buffer), ['Paul', 'Bob']);
  });

  it('Fallback Step: uses analyzeMatchResultsImage when step is unexpected', async () => {
    const fallbackResult = {
      matches: []
    };

    mockAnalyzeMatchResultsImage.mockResolvedValue(fallbackResult);

    const request = createMockRequest({
      image: mockImageFile,
      playerNames: '["Alice", "Bob"]',
      step: 'unsupported-value'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('match_results');
    expect(data.additionalData).toEqual(fallbackResult);
    expect(mockAnalyzeMatchResultsImage).toHaveBeenCalledWith(expect.any(Buffer), ['Alice', 'Bob']);
  });

  it('returns 500 Internal Server Error when form parsing or processing fails', async () => {
    const request = createMockRequest({}, true); // reject form data parsing

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process image');
    expect(data.response).toContain('I apologize, but I encountered an error');
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('returns 401 Unauthorized when not an admin', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const request = createMockRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.response).toContain('admin');
    expect(data.timestamp).toBeDefined();
  });

  it('returns 429 Too Many Requests when rate limit is exceeded', async () => {
    const request = createMockRequest(
      {},
      false,
      { 'x-forwarded-for': '127.0.0.1' }
    );

    for (let i = 0; i < 20; i++) {
      const res = await POST(request);
      expect(res.status).not.toBe(429);
    }

    const rateLimitedRes = await POST(request);
    expect(rateLimitedRes.status).toBe(429);
    const data = await rateLimitedRes.json();
    expect(data.error).toBe('Too many requests');
    expect(data.timestamp).toBeDefined();
  });
});
