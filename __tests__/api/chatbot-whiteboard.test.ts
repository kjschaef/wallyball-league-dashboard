import { NextRequest } from 'next/server';
import { POST as parsePOST } from '../../app/api/chatbot/whiteboard/route';
import { POST as logPOST } from '../../app/api/chatbot/whiteboard/log/route';
import { resetRateLimit } from '../../app/lib/rateLimit';

const mockAnalyzeWhiteboardScores = jest.fn();
const mockSql = jest.fn();

jest.mock('@/app/lib/openai', () => ({
  analyzeWhiteboardScores: (...args: unknown[]) => mockAnalyzeWhiteboardScores(...args),
}));

jest.mock('@neondatabase/serverless', () => ({
  neon: () => (...args: unknown[]) => mockSql(...args),
}));

const mockImageFile = {
  size: 1024,
  arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
} as unknown as File;

describe('Whiteboard API routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimit();
    process.env = { ...originalEnv, DATABASE_URL: 'postgres://test' };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('POST /api/chatbot/whiteboard', () => {
    it('returns 400 when image is missing', async () => {
      const req = {
        headers: new Headers(),
        formData: async () => ({ get: () => null }),
      } as unknown as NextRequest;

      const res = await parsePOST(req);
      expect(res.status).toBe(400);
    });

    it('parses whiteboard image with roster context and returns normalized matches', async () => {
      mockSql.mockResolvedValueOnce([
        { name: 'Nate' },
        { name: 'Ben' },
        { name: 'Keith' },
        { name: 'Hal' },
        { name: 'Mark' },
        { name: 'Vamsi' },
      ]);

      mockAnalyzeWhiteboardScores.mockResolvedValueOnce({
        matches: [
          {
            matchNumber: 1,
            teamOne: { players: ['Nate', 'Ben', 'Keith'] },
            teamTwo: { players: ['Hal', 'Mark', 'Vamsi'] },
            games: [
              { teamOneScore: 5, teamTwoScore: 11 },
              { teamOneScore: 11, teamTwoScore: 6 },
              { teamOneScore: 11, teamTwoScore: 7 },
            ],
            played: true,
          },
        ],
      });

      const req = {
        headers: new Headers(),
        formData: async () => ({
          get: (key: string) => (key === 'image' ? mockImageFile : null),
        }),
      } as unknown as NextRequest;

      const res = await parsePOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.type).toBe('whiteboard_results');
      expect(mockAnalyzeWhiteboardScores).toHaveBeenCalledWith(
        expect.any(Buffer),
        ['Nate', 'Ben', 'Keith', 'Hal', 'Mark', 'Vamsi']
      );
      expect(data.additionalData.matches).toHaveLength(1);
      expect(data.additionalData.matches[0].needsReview).toBe(false);
    });
  });

  describe('POST /api/chatbot/whiteboard/log', () => {
    it('logs confirmed matches and inserts per-game scores', async () => {
      mockSql
        .mockResolvedValueOnce([
          { id: 1, name: 'Nate' },
          { id: 2, name: 'Ben' },
          { id: 3, name: 'Keith' },
          { id: 4, name: 'Hal' },
          { id: 5, name: 'Mark' },
          { id: 6, name: 'Vamsi' },
        ])
        .mockResolvedValueOnce([{ id: 101 }])
        .mockResolvedValue([]);

      const req = {
        headers: new Headers(),
        json: async () => ({
          date: '2026-10-23',
          matches: [
            {
              teamOnePlayers: ['Nate', 'Ben', 'Keith'],
              teamTwoPlayers: ['Hal', 'Mark', 'Vamsi'],
              games: [
                { teamOneScore: 5, teamTwoScore: 11 },
                { teamOneScore: 11, teamTwoScore: 6 },
                { teamOneScore: 11, teamTwoScore: 7 },
              ],
            },
          ],
        }),
      } as unknown as NextRequest;

      const res = await logPOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.logged).toEqual([
        { id: 101, teamOneGamesWon: 2, teamTwoGamesWon: 1, gameCount: 3 },
      ]);
    });
  });
});
