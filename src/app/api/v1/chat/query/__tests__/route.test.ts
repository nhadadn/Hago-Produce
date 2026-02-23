/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse } from '@/lib/services/chat/openai-client';

// Mocks
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn(),
}));
jest.mock('@/lib/services/chat/intents');
jest.mock('@/lib/services/chat/query-executor');
jest.mock('@/lib/services/chat/openai-client');

const mockGetAuthenticatedUser = getAuthenticatedUser as jest.Mock;
const mockUnauthorizedResponse = unauthorizedResponse as jest.Mock;
const mockAnalyzeIntent = analyzeIntent as jest.Mock;
const mockExecuteQuery = executeQuery as jest.Mock;
const mockFormatResponse = formatResponse as jest.Mock;

describe('POST /api/v1/chat/query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock for unauthorizedResponse
    mockUnauthorizedResponse.mockReturnValue(NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    ));
  });

  it('returns 401 if not authenticated', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/v1/chat/query', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if message is missing', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ userId: 'user1', customerId: 'cust1' });
    const req = new NextRequest('http://localhost/api/v1/chat/query', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 with successful response', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ userId: 'user1', customerId: 'cust1' });
    mockAnalyzeIntent.mockReturnValue({ intent: 'greeting', confidence: 0.9 });
    mockExecuteQuery.mockResolvedValue({
      intent: 'greeting',
      confidence: 0.9,
      language: 'es',
      sources: [],
    });
    mockFormatResponse.mockResolvedValue('Hola, ¿cómo puedo ayudarte?');

    const req = new NextRequest('http://localhost/api/v1/chat/query', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hola', language: 'es' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    
    expect(json.success).toBe(true);
    expect(json.data.response).toBe('Hola, ¿cómo puedo ayudarte?');
    expect(json.data.intent).toBe('greeting');
  });

  it('returns cached response if available', async () => {
    // First request to populate cache
    mockGetAuthenticatedUser.mockResolvedValue({ userId: 'user1', customerId: 'cust1' });
    mockAnalyzeIntent.mockReturnValue({ intent: 'greeting', confidence: 0.9 });
    mockExecuteQuery.mockResolvedValue({
      intent: 'greeting',
      confidence: 0.9,
      language: 'es',
      sources: [],
    });
    mockFormatResponse.mockResolvedValue('Hola cached');

    const req1 = new NextRequest('http://localhost/api/v1/chat/query', {
      method: 'POST',
      body: JSON.stringify({ message: 'Cache me', language: 'es' }),
    });
    await POST(req1);

    // Second request should be cached
    const req2 = new NextRequest('http://localhost/api/v1/chat/query', {
      method: 'POST',
      body: JSON.stringify({ message: 'Cache me', language: 'es' }),
    });
    const res2 = await POST(req2);
    const json2 = await res2.json();

    expect(json2.meta.cached).toBe(true);
    expect(json2.data.response).toBe('Hola cached');
    // Note: In real implementation, analyzeIntent is called before checking cache?
    // Let's check the code:
    // const language = normalizeLanguage(body.language || null);
    // const cacheKey = getCacheKey(body.message, language, user.userId);
    // const cached = getFromCache(cacheKey);
    // if (cached) return ...
    // So analyzeIntent is NOT called if cached.
    
    // However, analyzeIntent mock was called in the FIRST request.
    // We expect it to be called ONCE total (for the first request).
    expect(mockAnalyzeIntent).toHaveBeenCalledTimes(1); 
  });
});
