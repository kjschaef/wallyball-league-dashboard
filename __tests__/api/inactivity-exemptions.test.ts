import { NextRequest } from 'next/server';
import {
  GET as getExemptions,
  POST as createExemption,
  PUT as updateExemption,
  DELETE as deleteExemption,
} from '@/app/api/inactivity-exemptions/route';

if (typeof globalThis.Response === 'undefined' || typeof globalThis.Request === 'undefined') {
  let undici;
  try {
    undici = require('node:undici');
  } catch (e) {
    try {
      undici = require('undici');
    } catch (e2) {
      undici = undefined;
    }
  }
  if (undici) {
    if (typeof globalThis.Response === 'undefined') {
      globalThis.Response = undici.Response;
    }
    if (typeof globalThis.Request === 'undefined') {
      globalThis.Request = undici.Request;
    }
  }
}

// Minimal Request/Response polyfills for environments without undici
if (typeof globalThis.Request === 'undefined') {
  class SimpleRequest {
    url: string;
    method: string;
    headers: any;
    body: any;
    constructor(url: string, init: RequestInit = {}) {
      this.url = url;
      this.method = (init.method || 'GET') as string;
      this.headers = init.headers || {};
      this.body = init.body;
    }
    async json() {
      return this.body ? JSON.parse(this.body as string) : undefined;
    }
    async text() {
      return this.body ? String(this.body) : '';
    }
  }
  // @ts-ignore
  globalThis.Request = SimpleRequest as any;
}

if (typeof globalThis.Response === 'undefined') {
  class SimpleResponse {
    body: any;
    status: number;
    headers: any;
    constructor(body: any = null, init: { status?: number; headers?: any } = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.headers = init.headers || {};
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    async text() {
      return this.body != null ? String(this.body) : '';
    }
  }

  // Provide static convenience method used by Next.js route helpers: `Response.json(...)`
  // Matches NextResponse.json behavior for tests.
  // @ts-ignore
  SimpleResponse.json = function (payload: any, init: { status?: number; headers?: any } = {}) {
    return new SimpleResponse(JSON.stringify(payload), init);
  };
  // @ts-ignore
  globalThis.Response = SimpleResponse as any;
}

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(),
}));

const { neon } = require('@neondatabase/serverless') as { neon: jest.Mock };
const originalDbUrl = process.env.DATABASE_URL;

const buildGetRequest = (url: string) => new NextRequest(url);
const buildRequestWithBody = (url: string, init: RequestInit) =>
  new Request(url, init) as unknown as NextRequest;

afterEach(() => {
  jest.clearAllMocks();
  process.env.DATABASE_URL = originalDbUrl;
});

describe('/api/inactivity-exemptions API routes', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'mock-db-url';
  });

  it('returns all exemptions ordered by start date', async () => {
    const sqlMock = jest.fn().mockResolvedValueOnce([
      {
        id: 1,
        player_id: 3,
        reason: 'Vacation',
        start_date: new Date('2024-03-01T00:00:00Z'),
        end_date: new Date('2024-03-10T00:00:00Z'),
      },
    ]);
    neon.mockReturnValue(sqlMock);

    const request = buildGetRequest('http://localhost:3000/api/inactivity-exemptions');
    const response = await getExemptions(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      {
        id: 1,
        playerId: 3,
        reason: 'Vacation',
        startDate: '2024-03-01T00:00:00.000Z',
        endDate: '2024-03-10T00:00:00.000Z',
      },
    ]);
    const query = sqlMock.mock.calls[0][0].join(' ').toLowerCase();
    expect(query).toContain('select * from inactivity_exemptions');
    expect(query).not.toContain('where player_id');
  });

  it('filters exemptions by player id when provided', async () => {
    const sqlMock = jest.fn().mockResolvedValueOnce([
      {
        id: 2,
        player_id: 4,
        reason: 'Injury',
        start_date: new Date('2024-04-01T00:00:00Z'),
        end_date: null,
      },
    ]);
    neon.mockReturnValue(sqlMock);

    const request = buildGetRequest('http://localhost:3000/api/inactivity-exemptions?playerId=4');
    const response = await getExemptions(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0]).toMatchObject({
      id: 2,
      playerId: 4,
      reason: 'Injury',
      endDate: null,
    });
    const query = sqlMock.mock.calls[0][0].join(' ').toLowerCase();
    expect(query).toContain('where player_id');
  });

  it('gracefully reports database errors during fetch', async () => {
    const sqlMock = jest.fn().mockRejectedValue(new Error('Database unavailable'));
    neon.mockReturnValue(sqlMock);

    const request = buildGetRequest('http://localhost:3000/api/inactivity-exemptions');
    const response = await getExemptions(request);
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).toBe('Database unavailable');
  });

  it('creates a new exemption when payload is valid', async () => {
    const sqlMock = jest
      .fn()
      .mockResolvedValueOnce([{ id: 4 }])
      .mockResolvedValueOnce([
        {
          id: 6,
          player_id: 4,
          reason: 'Medical',
          start_date: new Date('2024-05-01T00:00:00Z'),
          end_date: null,
        },
      ]);
    neon.mockReturnValue(sqlMock);

    const payload = {
      playerId: 4,
      reason: 'Medical',
      startDate: '2024-05-01',
      endDate: null,
    };
    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await createExemption(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      id: 6,
      playerId: 4,
      reason: 'Medical',
      startDate: '2024-05-01T00:00:00.000Z',
      endDate: null,
    });
    expect(sqlMock).toHaveBeenCalledTimes(2);
    const insertQuery = sqlMock.mock.calls[1][0].join(' ').toLowerCase();
    expect(insertQuery).toContain('insert into inactivity_exemptions');
  });

  it('rejects creation when required fields are missing', async () => {
    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Oops' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await createExemption(request);
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toBe('playerId and startDate are required');
    expect(neon).not.toHaveBeenCalled();
  });

  it('returns 404 when creating for a non-existent player', async () => {
    const sqlMock = jest.fn().mockResolvedValueOnce([]);
    neon.mockReturnValue(sqlMock);

    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions', {
      method: 'POST',
      body: JSON.stringify({ playerId: 99, startDate: '2024-06-01' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await createExemption(request);
    const text = await response.text();

    expect(response.status).toBe(404);
    expect(text).toBe('Player not found');
  });

  it('updates an existing exemption by merging provided fields', async () => {
    const existingRow = {
      id: 8,
      player_id: 5,
      reason: 'Travel',
      start_date: new Date('2024-06-01T00:00:00Z'),
      end_date: null,
    };
    const updatedRow = {
      ...existingRow,
      reason: 'Updated reason',
      end_date: new Date('2024-06-15T00:00:00Z'),
    };

    const sqlMock = jest
      .fn()
      .mockResolvedValueOnce([existingRow])
      .mockResolvedValueOnce([updatedRow]);
    neon.mockReturnValue(sqlMock);

    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions', {
      method: 'PUT',
      body: JSON.stringify({
        id: 8,
        reason: 'Updated reason',
        endDate: '2024-06-15',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await updateExemption(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 8,
      playerId: 5,
      reason: 'Updated reason',
      startDate: '2024-06-01T00:00:00.000Z',
      endDate: '2024-06-15T00:00:00.000Z',
    });
  });

  it('returns 404 when attempting to update a missing exemption', async () => {
    const sqlMock = jest.fn().mockResolvedValueOnce([]);
    neon.mockReturnValue(sqlMock);

    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions', {
      method: 'PUT',
      body: JSON.stringify({ id: 123, endDate: '2024-06-15' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await updateExemption(request);
    const text = await response.text();

    expect(response.status).toBe(404);
    expect(text).toBe('Exemption not found');
  });

  it('requires an id to update an exemption', async () => {
    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions', {
      method: 'PUT',
      body: JSON.stringify({ reason: 'Missing id' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await updateExemption(request);
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toBe('id is required');
    expect(neon).not.toHaveBeenCalled();
  });

  it('deletes an exemption by identifier', async () => {
    const sqlMock = jest.fn().mockResolvedValueOnce([]);
    neon.mockReturnValue(sqlMock);

    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions?id=9', {
      method: 'DELETE',
    });
    const response = await deleteExemption(request);

    expect(response.status).toBe(204);
    expect(sqlMock).toHaveBeenCalledTimes(1);
    const query = sqlMock.mock.calls[0][0].join(' ').toLowerCase();
    expect(query).toContain('delete from inactivity_exemptions');
  });

  it('requires an id to delete an exemption', async () => {
    const request = buildRequestWithBody('http://localhost:3000/api/inactivity-exemptions', {
      method: 'DELETE',
    });
    const response = await deleteExemption(request);
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toBe('id is required');
    expect(neon).not.toHaveBeenCalled();
  });
});
