import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/services/notifications/twilio';
import { sendTelegramMessage } from '@/lib/services/notifications/telegram';
import { logger } from '@/lib/logger/logger.service';

type WebhookChannel = 'whatsapp' | 'telegram' | 'both';

interface SendNotificationBody {
  channel: WebhookChannel;
  text: string;
  toWhatsApp?: string;
  telegramChatId?: string;
}

interface RateLimitState {
  timestamps: number[];
}

interface IdempotencyEntry {
  status: number;
  body: unknown;
  createdAt: number;
}

type RateLimitKey = string;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const IDEMPOTENCY_TTL_MS = 60 * 60_000;

const rateLimitStore = new Map<RateLimitKey, RateLimitState>();
const idempotencyStore = new Map<string, IdempotencyEntry>();

function getRateLimitKey(req: NextRequest): RateLimitKey {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return apiKey;
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) {
      return ip;
    }
  }

  return 'anonymous';
}

function isRateLimited(key: RateLimitKey): boolean {
  const now = Date.now();
  const state = rateLimitStore.get(key) || { timestamps: [] };
  const recent = state.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  state.timestamps = recent;
  rateLimitStore.set(key, state);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

function getIdempotencyKey(req: NextRequest, body: SendNotificationBody | null): string | null {
  const headerKey = req.headers.get('Idempotency-Key');
  if (headerKey && headerKey.trim()) {
    return headerKey.trim();
  }

  const bodyKey = (body as any)?.idempotencyKey;
  if (typeof bodyKey === 'string' && bodyKey.trim()) {
    return bodyKey.trim();
  }

  return null;
}

function getFromIdempotencyStore(key: string): IdempotencyEntry | null {
  const entry = idempotencyStore.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.createdAt > IDEMPOTENCY_TTL_MS) {
    idempotencyStore.delete(key);
    return null;
  }

  return entry;
}

function saveIdempotencyEntry(key: string, status: number, body: unknown): void {
  idempotencyStore.set(key, {
    status,
    body,
    createdAt: Date.now(),
  });
}

async function sendWithRetry(action: () => Promise<void>, maxRetries: number): Promise<void> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    try {
      attempt += 1;
      await action();
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.NOTIFICATIONS_WEBHOOK_SECRET;
    const apiKey = req.headers.get('x-api-key');

    if (!secret || apiKey !== secret) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API Key' } },
        { status: 401 },
      );
    }

    const rateKey = getRateLimitKey(req);
    if (isRateLimited(rateKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiadas solicitudes de webhook. Intente de nuevo más tarde.',
          },
        },
        { status: 429 },
      );
    }

    const json = (await req.json()) as SendNotificationBody | null;

    const idempotencyKey = getIdempotencyKey(req, json);
    if (idempotencyKey) {
      const existing = getFromIdempotencyStore(idempotencyKey);
      if (existing) {
        return NextResponse.json(existing.body, { status: existing.status });
      }
    }

    if (!json || typeof json.text !== 'string' || !json.text.trim()) {
      const responseBody = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El campo text es obligatorio.',
        },
      };
      const status = 400;
      if (idempotencyKey) {
        saveIdempotencyEntry(idempotencyKey, status, responseBody);
      }
      return NextResponse.json(responseBody, { status });
    }

    const channel = json.channel;
    const text = json.text.trim();

    if (!channel || !['whatsapp', 'telegram', 'both'].includes(channel)) {
      const responseBody = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Canal inválido. Use whatsapp, telegram o both.',
        },
      };
      const status = 400;
      if (idempotencyKey) {
        saveIdempotencyEntry(idempotencyKey, status, responseBody);
      }
      return NextResponse.json(responseBody, { status });
    }

    const deliverWhatsApp = channel === 'whatsapp' || channel === 'both';
    const deliverTelegram = channel === 'telegram' || channel === 'both';

    const deliveredChannels: string[] = [];

    if (deliverWhatsApp) {
      if (!json.toWhatsApp || !json.toWhatsApp.trim()) {
        const responseBody = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'toWhatsApp es obligatorio para canal whatsapp.',
          },
        };
        const status = 400;
        if (idempotencyKey) {
          saveIdempotencyEntry(idempotencyKey, status, responseBody);
        }
        return NextResponse.json(responseBody, { status });
      }

      await sendWithRetry(() => sendWhatsAppMessage(json.toWhatsApp as string, text), 3);
      deliveredChannels.push('whatsapp');
    }

    if (deliverTelegram) {
      if (!json.telegramChatId || !json.telegramChatId.trim()) {
        const responseBody = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'telegramChatId es obligatorio para canal telegram.',
          },
        };
        const status = 400;
        if (idempotencyKey) {
          saveIdempotencyEntry(idempotencyKey, status, responseBody);
        }
        return NextResponse.json(responseBody, { status });
      }

      await sendWithRetry(() => sendTelegramMessage(json.telegramChatId as string, text), 3);
      deliveredChannels.push('telegram');
    }

    const responseBody = {
      success: true,
      data: {
        deliveredChannels,
      },
    };
    const status = 200;

    if (idempotencyKey) {
      saveIdempotencyEntry(idempotencyKey, status, responseBody);
    }

    return NextResponse.json(responseBody, { status });
  } catch (error) {
    logger.error('[WEBHOOK_NOTIFICATIONS_SEND]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      },
      { status: 500 },
    );
  }
}
