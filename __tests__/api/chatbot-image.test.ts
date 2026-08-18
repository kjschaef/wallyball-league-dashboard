import { NextRequest } from 'next/server';
import { POST } from '../../app/api/chatbot/image/route';

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

const createMockRequest = (formDataValues: Record<string, any>, rejectFormData = false) => {
  return {
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
});
