/**
 * ⚠️ SERVER-SIDE ONLY LOGGER ⚠️
 *
 * Este logger utiliza dependencias de Node.js (Winston, Sentry Node) y NO debe ser importado
 * en componentes de cliente ("use client").
 *
 * Para componentes de cliente, usar:
 * import { clientLogger } from '@/lib/logger/client-logger';
 *
 * Contextos de uso: API Routes, Server Actions, Services, Scripts.
 */
export * from '../infrastructure/logger.service';
import { logger } from '../infrastructure/logger.service';
export { logger };
