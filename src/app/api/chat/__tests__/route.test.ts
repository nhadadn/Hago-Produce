/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

jest.mock('@/lib/services/chat/intents', () => ({
  analyzeIntent: jest.fn(),
}));

jest.mock('@/lib/services/chat/query-executor', () => ({
  executeQuery: jest.fn(),
}));

jest.mock('@/lib/services/chat/openai-client', () => ({
  formatResponse: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    chatSession: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ sessionId: 'existing-session', messages: [] }),
      update: jest.fn().mockResolvedValue({}),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/utils/rate-limit', () => ({
  isRateLimited: jest.fn(() => false),
  createRateLimitResponse: jest.requireActual('@/lib/utils/rate-limit').createRateLimitResponse,
}));

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse } from '@/lib/services/chat/openai-client';
import { isRateLimited } from '@/lib/utils/rate-limit';

describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if message is missing', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-1' });

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('processes the message and returns reply', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-1', customerId: 'cust-1' });
    (analyzeIntent as jest.Mock).mockReturnValue({ intent: 'greeting' });
    (executeQuery as jest.Mock).mockResolvedValue({ data: 'some data' });
    (formatResponse as jest.Mock).mockResolvedValue('Hello there!');

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hi' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe('Hello there!');
    expect(data.intent).toBe('greeting');
    expect(data.sessionId).toBeDefined();

    expect(analyzeIntent).toHaveBeenCalledWith('Hi', 'es', {}); // Default language
    expect(executeQuery).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'greeting' }),
      'es',
      expect.objectContaining({ userId: 'user-1', customerId: 'cust-1' })
    );
  });

  it('uses provided session ID', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-1' });
    (formatResponse as jest.Mock).mockResolvedValue('Reply');

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hi', sessionId: 'existing-session' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.sessionId).toBe('existing-session');
  });

  it('handles context language', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-1' });
    (analyzeIntent as jest.Mock).mockReturnValue({ intent: 'test' });
    (formatResponse as jest.Mock).mockResolvedValue('Reply');

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'Hi', 
        context: { language: 'en' } 
      }),
    });

    await POST(req);

    expect(analyzeIntent).toHaveBeenCalledWith('Hi', 'en', {});
  });

  it('returns 429 when rate limit is exceeded', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-rl-1' });
    (isRateLimited as jest.Mock).mockReturnValueOnce(true);

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hola' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.code || json.error?.code).toBe('RATE_LIMITED');
  });
});
