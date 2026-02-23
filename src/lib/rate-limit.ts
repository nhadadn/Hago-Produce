import { NextRequest } from 'next/server';

type RateLimitKey = string;

interface RateLimitState {
  timestamps: number[];
}

const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitStore = new Map<RateLimitKey, RateLimitState>();

export function getUserRateLimitKey(userId: string | undefined, req: NextRequest): RateLimitKey {
  if (userId) return userId;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) return ip;
  }
  return 'anonymous';
}

export function isRateLimited(key: RateLimitKey, maxRequests: number): boolean {
  const now = Date.now();
  const state = rateLimitStore.get(key) || { timestamps: [] };
  const recent = state.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  state.timestamps = recent;
  rateLimitStore.set(key, state);
  return recent.length > maxRequests;
}

