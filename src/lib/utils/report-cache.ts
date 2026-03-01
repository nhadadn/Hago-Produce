
import prisma from '@/lib/db';
import crypto from 'crypto';
import { logger } from '@/lib/logger/logger.service';

export type ReportType = 
  | 'REVENUE'
  | 'AGING'
  | 'TOP_CUSTOMERS'
  | 'TOP_PRODUCTS'
  | 'PRICE_TRENDS'
  | 'TOP_PERFORMERS';

export const REPORT_TTL: Record<ReportType, number> = {
  REVENUE: 60, // 1 hour
  AGING: 30, // 30 minutes
  TOP_CUSTOMERS: 120, // 2 hours
  TOP_PRODUCTS: 120, // 2 hours
  TOP_PERFORMERS: 120, // 2 hours
  PRICE_TRENDS: 360, // 6 hours
};

/**
 * Generates a consistent hash for the report parameters
 */
function generateCacheKey(parameters: any): string {
  // Sort keys to ensure consistent order
  const sortedParams = Object.keys(parameters || {})
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = parameters[key];
      return acc;
    }, {});
    
  return crypto
    .createHash('md5')
    .update(JSON.stringify(sortedParams))
    .digest('hex');
}

/**
 * Retrieves a cached report if it exists and hasn't expired
 */
export async function getCachedReport<T>(
  reportType: ReportType,
  parameters: any
): Promise<T | null> {
  try {
    // Generate parameter hash to find exact match
    // Note: In a real scenario, we might want to store the hash in the DB 
    // to avoid strict string matching on JSON, but the current schema uses 
    // parameters as text. For now, we'll verify parameters match.
    // However, since the schema doesn't have a 'hash' field, we rely on 
    // finding by reportType and filtering in memory or exact string match if possible.
    // Given the schema definition: parameters String @db.Text // JSON string
    // exact string matching on JSON is flaky.
    
    // BETTER APPROACH: 
    // Since we can't easily query by JSON equality in generic SQL without native JSON support 
    // (Prisma supports it but strict equality is tricky), and we don't have a hash column,
    // we will rely on a standardized JSON string storage.
    
    const paramString = JSON.stringify(parameters); // We assume caller standardizes this or we do.
    // To be safe, we should probably add a hash column in a future migration, 
    // but for now let's try to find by reportType and then filter.
    // Or simpler: rely on the fact that we will always stringify the same way in setCachedReport.
    
    // Wait, the prompt requirements said:
    // "Genera hash MD5 o SHA256 de los parámetros para la cache key"
    // But the schema doesn't have a cache key column.
    // It says: "busca en ReportCache por tipo y hash de params"
    // If there is no hash column, maybe I should check if I can modify the schema?
    // The prompt says "El modelo ReportCache existe... id, reportType, parameters, data...".
    // It does NOT mention a hash column.
    // So "busca... por hash" implies I should probably query by `reportType` and `expiresAt > now`,
    // and then iterate to find the matching parameters hash? 
    // Or maybe it meant "use the hash as the ID"? No, ID is UUID.
    
    // Let's look at the schema again.
    // model ReportCache { ... parameters String @db.Text ... }
    
    // Efficiency wise:
    // If I fetch all valid caches for a reportType, it might be too many.
    // But typically reports are not that many per type.
    // Let's try to find a record where reportType matches and we check the parameters.
    // Since we don't have a hash column, we have to store the parameters as a string.
    // If we consistently stringify, we can query by that string.
    
    const now = new Date();
    
    // We will use the generateCacheKey to standardise the input, 
    // but since we store the full JSON string in 'parameters', we should store it 
    // in a canonical format or store the hash in 'parameters'? 
    // The schema says `parameters String @db.Text // JSON string`.
    // So it expects JSON.
    
    // I will try to findFirst where parameters equals the stringified parameters.
    // Prisma text search is case sensitive usually.
    
    // To ensure consistency, I will use a helper to stringify parameters deterministically.
    const normalizedParams = JSON.stringify(
      Object.keys(parameters || {}).sort().reduce((acc: any, key) => {
        acc[key] = parameters[key];
        return acc;
      }, {})
    );

    const cached = await prisma.reportCache.findFirst({
      where: {
        reportType,
        parameters: normalizedParams,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!cached) return null;

    return JSON.parse(cached.data) as T;
  } catch (error) {
      logger.error('[CACHE_GET_ERROR]', error);
      return null;
    }
}

/**
 * Stores a report in the cache
 */
export async function setCachedReport(
  reportType: ReportType,
  parameters: any,
  data: any,
  ttlMinutes?: number
): Promise<void> {
  try {
    const ttl = ttlMinutes || REPORT_TTL[reportType] || 60;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttl);

    const normalizedParams = JSON.stringify(
      Object.keys(parameters || {}).sort().reduce((acc: any, key) => {
        acc[key] = parameters[key];
        return acc;
      }, {})
    );

    const dataString = JSON.stringify(data);

    // Use a transaction or just create/update.
    // Since we don't have a unique constraint on (reportType, parameters),
    // upsert is tricky without a unique compound index.
    // The schema has @@index([reportType]) and @@index([expiresAt]), but no unique on params.
    // So we should check if exists, update it, or create new.
    // Or just delete old ones and create new.
    
    // Delete existing valid or invalid cache for this specific param set to avoid duplicates
    await prisma.reportCache.deleteMany({
      where: {
        reportType,
        parameters: normalizedParams,
      },
    });

    await prisma.reportCache.create({
      data: {
        reportType,
        parameters: normalizedParams,
        data: dataString,
        expiresAt,
      },
    });
  } catch (error) {
    logger.error('[CACHE_SET_ERROR]', error);
  }
}

/**
 * Invalidates cache for a specific report type or all caches
 */
export async function invalidateCache(reportType?: ReportType): Promise<number> {
  try {
    const now = new Date();
    
    if (reportType) {
      // Invalidate all of this type, regardless of expiration?
      // "Con reportType: elimina todos los cachés de ese tipo" - implies all.
      const { count } = await prisma.reportCache.deleteMany({
        where: {
          reportType,
        },
      });
      return count;
    } else {
      // "Sin parámetro: elimina todos los cachés con expiresAt < now()"
      // Wait, usually global invalidation clears everything or just expired?
      // Prompt: "Sin parámetro: elimina todos los cachés con expiresAt < now()"
      // Ah, that sounds like a cleanup job.
      // But typically "invalidate cache" means "clear cache so I get fresh data".
      // Let's follow the prompt exactly.
      // "Sin parámetro: elimina todos los cachés con expiresAt < now()"
      
      const { count } = await prisma.reportCache.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      return count;
    }
  } catch (error) {
    logger.error('[CACHE_INVALIDATE_ERROR]', error);
    return 0;
  }
}

/**
 * Force invalidates ALL cache (for admin manual clear)
 */
export async function clearAllCache(): Promise<number> {
    try {
        const { count } = await prisma.reportCache.deleteMany({});
        return count;
    } catch (error) {
        logger.error('[CACHE_CLEAR_ALL_ERROR]', error);
        return 0;
    }
}
