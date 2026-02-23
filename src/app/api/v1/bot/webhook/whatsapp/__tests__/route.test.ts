/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';

jest.mock('@/lib/services/bot/whatsapp.service', () => ({
  whatsAppService: {
    validateWebhookSignature: jest.fn(() => true),
    sendMessage: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/lib/services/bot/query.service', () => ({
  BotQueryService: jest.fn().mockImplementation(() => ({
    executeQuery: jest.fn().mockResolvedValue({ response: 'ok', intent: 'test', confidence: 0.9 }),
  })),
}));

jest.mock('@/lib/services/bot/command-handler.service', () => ({
  commandHandler: {
    isCommand: jest.fn(() => ({ isCommand: false })),
    handleCommand: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    message: {
      create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('@/lib/utils/rate-limit', () => ({
  isRateLimited: jest.fn(() => false),
  createRateLimitResponse: jest.requireActual('@/lib/utils/rate-limit').createRateLimitResponse,
}));

import { whatsAppService } from '@/lib/services/bot/whatsapp.service';
import { isRateLimited } from '@/lib/utils/rate-limit';

describe('POST /api/v1/bot/webhook/whatsapp', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv } as any;
  });

  afterAll(() => {
    process.env = originalEnv as any;
  });

  it('requires signature in production', async () => {
    process.env.NODE_ENV = 'production';

    const body = 'From=whatsapp%3A%2B5215555550000&Body=Hola';
    const req = new NextRequest('http://localhost/api/v1/bot/webhook/whatsapp', {
      method: 'POST',
      headers: {} as any,
      body,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.code).toBe('MISSING_SIGNATURE');
    expect((whatsAppService.sendMessage as jest.Mock)).not.toHaveBeenCalled();
  });

  it('processes message in development without signature', async () => {
    process.env.NODE_ENV = 'test';

    const body = 'From=whatsapp%3A%2B5215555550000&Body=Hola';
    const req = new NextRequest('http://localhost/api/v1/bot/webhook/whatsapp', {
      method: 'POST',
      headers: {} as any,
      body,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect((whatsAppService.sendMessage as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('rate limits and sends notification', async () => {
    process.env.NODE_ENV = 'test';
    (isRateLimited as jest.Mock).mockReturnValueOnce(true);

    const body = 'From=whatsapp%3A%2B5215555550000&Body=Hola';
    const req = new NextRequest('http://localhost/api/v1/bot/webhook/whatsapp', {
      method: 'POST',
      headers: {} as any,
      body,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('RATE_LIMITED');
    expect((whatsAppService.sendMessage as jest.Mock)).toHaveBeenCalledTimes(1);
  });
});

