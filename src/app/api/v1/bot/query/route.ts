import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiKey } from '@/lib/services/bot/api-key.service';
import { BotQueryService, botQuerySchema } from '@/lib/services/bot/query.service';

// Rate limiting storage
const rateLimitStore = new Map<string, { timestamps: number[]; windowMs: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window

/**
 * Limpia timestamps antiguos del rate limit store
 */
function cleanupRateLimitStore(key: string): void {
  const now = Date.now();
  const data = rateLimitStore.get(key);
  if (data) {
    data.timestamps = data.timestamps.filter(ts => now - ts < data.windowMs);
    if (data.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Verifica si una API key está rate limited
 */
function isRateLimited(apiKeyId: string, rateLimit: number): boolean {
  const now = Date.now();
  const key = `bot:${apiKeyId}`;
  
  cleanupRateLimitStore(key);
  
  const data = rateLimitStore.get(key) || { timestamps: [], windowMs: RATE_LIMIT_WINDOW_MS };
  
  // Agregar timestamp actual
  data.timestamps.push(now);
  rateLimitStore.set(key, data);
  
  // Verificar si excede el límite
  return data.timestamps.length > rateLimit;
}

/**
 * Calcula Retry-After header en segundos
 */
function getRetryAfterSeconds(apiKeyId: string): number {
  const key = `bot:${apiKeyId}`;
  const data = rateLimitStore.get(key);
  if (!data || data.timestamps.length === 0) return 60;
  
  const oldestTimestamp = Math.min(...data.timestamps);
  const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (Date.now() - oldestTimestamp)) / 1000);
  return Math.max(1, retryAfter);
}

/**
 * Respuesta de error no autorizado
 */
function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key inválida o no autorizada',
      },
    },
    { status: 401 }
  );
}

/**
 * Respuesta de rate limit excedido
 */
function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiadas solicitudes. Por favor intenta más tarde.',
        retryAfter: retryAfterSeconds,
      },
    },
    { status: 429, headers: { 'Retry-After': retryAfterSeconds.toString() } }
  );
}

/**
 * Respuesta de error de validación
 */
function validationErrorResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    },
    { status: 400 }
  );
}

/**
 * Respuesta de error interno
 */
function internalErrorResponse(message: string = 'Error interno del servidor'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    },
    { status: 500 }
  );
}

/**
 * POST /api/v1/bot/query
 * Endpoint para consultas de bots externos
 */
export async function POST(req: NextRequest) {
  try {
    // Validar API key
    const apiKey = req.headers.get('x-bot-api-key');
    if (!apiKey) {
      return unauthorizedResponse();
    }

    const keyInfo = await validateApiKey(apiKey);
    if (!keyInfo) {
      return unauthorizedResponse();
    }

    // Verificar rate limiting
    if (isRateLimited(keyInfo.id, keyInfo.rateLimit)) {
      const retryAfter = getRetryAfterSeconds(keyInfo.id);
      return rateLimitResponse(retryAfter);
    }

    // Parsear y validar payload
    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      return validationErrorResponse('Payload JSON inválido');
    }

    const validation = botQuerySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      return validationErrorResponse(`Validación fallida: ${errors}`);
    }

    const queryData = validation.data;

    // Procesar consulta
    const queryService = new BotQueryService();
    const result = await queryService.executeQuery(queryData);

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('[BOT_QUERY_ERROR]', error);
    return internalErrorResponse();
  }
}

/**
 * GET /api/v1/bot/query
 * Endpoint de health check para bots
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      endpoints: ['POST /api/v1/bot/query'],
    },
  });
}