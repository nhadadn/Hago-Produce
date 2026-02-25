import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  uniqueTokenPerInterval: number;
  interval: number;
}

export class RateLimiter {
  private tokenCache: Map<string, number[]>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokenCache = new Map();
  }

  check(limit: number, token: string): boolean {
    const now = Date.now();
    const tokenCount = this.tokenCache.get(token) || [0];
    
    // Filter out old timestamps
    const validTimestamps = tokenCount.filter(timestamp => now - timestamp < this.config.interval);
    
    if (validTimestamps.length >= limit) {
      return false;
    }
    
    validTimestamps.push(now);
    this.tokenCache.set(token, validTimestamps);
    
    // Cleanup periodically if map gets too large (simple approach)
    if (this.tokenCache.size > this.config.uniqueTokenPerInterval) {
      // Very naive cleanup: clear everything. 
      // In production with high traffic, use LRU or Redis.
      this.tokenCache.clear();
      this.tokenCache.set(token, validTimestamps);
    }
    
    return true;
  }
}

// Global instance for in-memory rate limiting (per serverless instance)
export const globalRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 500, // Max users/IPs to track in memory
  interval: 60000, // 1 minute
});

export function getRateLimitKey(req: NextRequest): string {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  return ip;
}
