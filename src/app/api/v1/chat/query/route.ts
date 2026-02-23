import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse } from '@/lib/services/chat/openai-client';
import { ChatLanguage, ChatRequestPayload, ChatResponseData } from '@/lib/chat/types';

type RateLimitKey = string;

interface RateLimitState {
  timestamps: number[];
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitStore = new Map<RateLimitKey, RateLimitState>();

const CACHE_TTL_MS = 5 * 60_000;

interface CacheEntry {
  result: ChatResponseData;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getRateLimitKey(userId: string | undefined, req: NextRequest): RateLimitKey {
  if (userId) return userId;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) return ip;
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

function normalizeLanguage(language?: string | null): ChatLanguage {
  if (language === 'en') return 'en';
  return 'es';
}

function getCacheKey(message: string, language: ChatLanguage, userId?: string): string {
  return JSON.stringify({
    message: message.trim().toLowerCase(),
    language,
    userId: userId || null,
  });
}

function getFromCache(key: string): ChatResponseData | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function saveToCache(key: string, result: ChatResponseData): void {
  cache.set(key, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const rateKey = getRateLimitKey(user.userId, req);
    if (isRateLimited(rateKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiadas solicitudes al chat. Intente de nuevo más tarde.',
          },
        },
        { status: 429 },
      );
    }

    const body = (await req.json()) as ChatRequestPayload;

    if (!body || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El mensaje es obligatorio.',
          },
        },
        { status: 400 },
      );
    }

    const language = normalizeLanguage(body.language || null);
    const cacheKey = getCacheKey(body.message, language, user.userId);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(
        {
          success: true,
          data: cached,
          meta: { cached: true },
        },
        { status: 200 },
      );
    }

    const detected = analyzeIntent(body.message, language);
    const executionResult = await executeQuery(detected, language, {
      userId: user.userId,
      customerId: user.customerId,
    });
    const responseText = await formatResponse(detected.intent, language, executionResult);

    const result: ChatResponseData = {
      response: responseText,
      intent: executionResult.intent,
      confidence: executionResult.confidence,
      language: executionResult.language,
      sources: executionResult.sources,
    };

    saveToCache(cacheKey, result);

    return NextResponse.json(
      {
        success: true,
        data: result,
        meta: { cached: false },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[CHAT_QUERY_POST]', error);
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

