/**
 * Utilidad de rate limiting para webhooks de WhatsApp y Telegram
 * Implementa rate limiting por usuario para prevenir spam y abuso
 */

interface RateLimitData {
  timestamps: number[];
  windowMs: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const DEFAULT_RATE_LIMIT = 10; // 10 mensajes por minuto

// Almacenamiento en memoria para rate limiting
const rateLimitStore = new Map<string, RateLimitData>();

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
 * Verifica si un usuario está rate limited
 */
export function isRateLimited(
  platform: 'whatsapp' | 'telegram' | 'chat_api',
  userId: string,
  rateLimit: number = DEFAULT_RATE_LIMIT
): boolean {
  const now = Date.now();
  const key = `${platform}:${userId}`;
  
  cleanupRateLimitStore(key);
  
  const data = rateLimitStore.get(key) || { 
    timestamps: [], 
    windowMs: RATE_LIMIT_WINDOW_MS 
  };
  
  // Agregar timestamp actual
  data.timestamps.push(now);
  rateLimitStore.set(key, data);
  
  // Verificar si excede el límite
  return data.timestamps.length > rateLimit;
}

/**
 * Calcula Retry-After header en segundos
 */
export function getRetryAfterSeconds(
  platform: 'whatsapp' | 'telegram' | 'chat_api',
  userId: string
): number {
  const key = `${platform}:${userId}`;
  const data = rateLimitStore.get(key);
  if (!data || data.timestamps.length === 0) return 60;
  
  const oldestTimestamp = Math.min(...data.timestamps);
  const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (Date.now() - oldestTimestamp)) / 1000);
  return Math.max(1, retryAfter);
}

/**
 * Obtiene estadísticas de rate limiting para un usuario
 */
export function getRateLimitStats(
  platform: 'whatsapp' | 'telegram' | 'chat_api',
  userId: string
): {
  currentCount: number;
  limit: number;
  windowMs: number;
  resetTime: Date;
} {
  const key = `${platform}:${userId}`;
  const data = rateLimitStore.get(key);
  
  if (!data || data.timestamps.length === 0) {
    return {
      currentCount: 0,
      limit: DEFAULT_RATE_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
      resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW_MS),
    };
  }
  
  const oldestTimestamp = Math.min(...data.timestamps);
  const resetTime = new Date(oldestTimestamp + RATE_LIMIT_WINDOW_MS);
  
  return {
    currentCount: data.timestamps.length,
    limit: DEFAULT_RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW_MS,
    resetTime,
  };
}

/**
 * Limpia todos los datos de rate limiting (útil para testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Respuesta de rate limit excedido
 */
export function createRateLimitResponse(
  platform: 'whatsapp' | 'telegram' | 'chat_api',
  userId: string,
  language: string = 'es'
): {
  success: boolean;
  error: {
    code: string;
    message: string;
    retryAfter: number;
  };
} {
  const retryAfter = getRetryAfterSeconds(platform, userId);
  
  const message = language === 'es'
    ? 'Demasiados mensajes. Por favor intenta más tarde.'
    : 'Too many messages. Please try again later.';
  
  return {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message,
      retryAfter,
    },
  };
}