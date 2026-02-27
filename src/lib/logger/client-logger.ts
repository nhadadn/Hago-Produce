/**
 * ✅ CLIENT-SIDE LOGGER ✅
 *
 * Este logger es seguro para usar en el navegador y componentes de React ("use client").
 * No tiene dependencias de Node.js.
 *
 * Para código de servidor (API, Services), usar:
 * import { logger } from '@/lib/logger/logger.service';
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>, error?: unknown): void;
  error(message: string, error?: unknown, context?: Record<string, any>): void;
}

class ClientLogger implements ILogger {
  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, context || '');
  }

  warn(message: string, context?: Record<string, any>, error?: unknown): void {
    console.warn(`[WARN] ${message}`, context || '', error || '');
  }

  error(message: string, error?: unknown, context?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, error || '', context || '');
  }
}

export const clientLogger = new ClientLogger();
