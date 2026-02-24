import { NextRequest } from 'next/server';

export class InMemoryRateLimiter {
  private static instance: InMemoryRateLimiter;
  private store: Map<string, number[]>;

  private constructor() {
    this.store = new Map();
  }

  public static getInstance(): InMemoryRateLimiter {
    if (!InMemoryRateLimiter.instance) {
      InMemoryRateLimiter.instance = new InMemoryRateLimiter();
    }
    return InMemoryRateLimiter.instance;
  }

  /**
   * Checks if a key has exceeded the rate limit.
   * @param key Unique identifier (e.g., userId or IP)
   * @param limit Max number of requests
   * @param windowMs Time window in milliseconds
   * @returns true if allowed, false if limit exceeded
   */
  public check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.store.get(key) || [];
    
    // Filter out timestamps outside the window
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);
    
    if (validTimestamps.length >= limit) {
      return false;
    }
    
    validTimestamps.push(now);
    this.store.set(key, validTimestamps);
    
    return true;
  }

  /**
   * Manually cleans up old entries (can be called periodically if needed)
   */
  public cleanup(windowMs: number) {
    const now = Date.now();
    for (const [key, timestamps] of this.store.entries()) {
      const validTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);
      if (validTimestamps.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, validTimestamps);
      }
    }
  }
}

const DEFAULT_WINDOW_MS = 60_000;

export function getUserRateLimitKey(userId: string, req: NextRequest): string {
  return `${userId}:${req.nextUrl.pathname}`;
}

export function isRateLimited(key: string, limit: number, windowMs: number = DEFAULT_WINDOW_MS): boolean {
  const limiter = InMemoryRateLimiter.getInstance();
  return !limiter.check(key, limit, windowMs);
}
