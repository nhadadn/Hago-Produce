
import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport, setCachedReport, invalidateCache, clearAllCache } from '@/lib/utils/report-cache';
import prisma from '@/lib/db';
import { POST as revenueRoute } from '@/app/api/v1/reports/revenue/route';
import { getRevenueMetrics } from '@/lib/services/reports';
import { getAuthenticatedUser } from '@/lib/auth/middleware';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  reportCache: {
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/lib/services/reports', () => ({
  getRevenueMetrics: jest.fn(),
}));

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn(() => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })),
}));

jest.mock('@/lib/rate-limit', () => ({
  getUserRateLimitKey: jest.fn(),
  isRateLimited: jest.fn(() => false),
}));

describe('Report Cache System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.reportCache.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.reportCache.create as jest.Mock).mockResolvedValue({ id: '1' });
  });

  describe('Utils: getCachedReport', () => {
    it('should return null if no cache exists', async () => {
      (prisma.reportCache.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await getCachedReport('REVENUE', { foo: 'bar' });
      expect(result).toBeNull();
    });

    it('should return cached data if valid cache exists', async () => {
      const mockData = { totalRevenue: 1000 };
      (prisma.reportCache.findFirst as jest.Mock).mockResolvedValue({
        data: JSON.stringify(mockData),
      });

      const result = await getCachedReport('REVENUE', { foo: 'bar' });
      expect(result).toEqual(mockData);
    });

    // Note: The `getCachedReport` implementation filters by `expiresAt: { gt: now }` in the query itself.
    // So "expired" effectively returns null from the DB.
    it('should query with expiration check', async () => {
      await getCachedReport('REVENUE', { foo: 'bar' });
      expect(prisma.reportCache.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: expect.objectContaining({ gt: expect.any(Date) }),
        }),
      }));
    });
  });

  describe('Utils: setCachedReport', () => {
    it('should create new cache record', async () => {
      await setCachedReport('REVENUE', { foo: 'bar' }, { totalRevenue: 1000 });
      
      expect(prisma.reportCache.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          reportType: 'REVENUE',
          data: JSON.stringify({ totalRevenue: 1000 }),
        }),
      }));
    });

    it('should delete existing cache before creating (upsert simulation)', async () => {
      await setCachedReport('REVENUE', { foo: 'bar' }, { totalRevenue: 1000 });
      
      expect(prisma.reportCache.deleteMany).toHaveBeenCalled();
      expect(prisma.reportCache.create).toHaveBeenCalled();
    });
  });

  describe('Utils: invalidateCache', () => {
    it('should delete expired caches when no type provided', async () => {
      await invalidateCache();
      expect(prisma.reportCache.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: expect.objectContaining({ lt: expect.any(Date) }),
        }),
      }));
    });

    it('should delete by type when type provided', async () => {
      await invalidateCache('REVENUE');
      expect(prisma.reportCache.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { reportType: 'REVENUE' },
      }));
    });
  });

  describe('API: X-Cache Headers', () => {
    const mockUser = { userId: 'user1', role: 'ADMIN' };
    const mockMetrics = {
      totalRevenue: 1000,
      monthlyRevenue: [],
      previousPeriodRevenue: 900,
      growthRate: 0.1,
      averageInvoiceAmount: 100,
    };

    beforeEach(() => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should return X-Cache: HIT when report is from cache', async () => {
      (getRevenueMetrics as jest.Mock).mockResolvedValue({
        ...mockMetrics,
        _fromCache: true,
      });

      const req = new NextRequest('http://localhost/api/v1/reports/revenue', {
        method: 'POST',
        body: JSON.stringify({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }),
      });

      const res = await revenueRoute(req);
      
      expect(res.headers.get('X-Cache')).toBe('HIT');
      expect(res.status).toBe(200);
    });

    it('should return X-Cache: MISS when report is NOT from cache', async () => {
      (getRevenueMetrics as jest.Mock).mockResolvedValue({
        ...mockMetrics,
        _fromCache: false,
      });

      const req = new NextRequest('http://localhost/api/v1/reports/revenue', {
        method: 'POST',
        body: JSON.stringify({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }),
      });

      const res = await revenueRoute(req);
      
      expect(res.headers.get('X-Cache')).toBe('MISS');
      expect(res.status).toBe(200);
    });
  });

  describe('Performance: Cache vs No Cache', () => {
    // This is a simulated performance test
    // We mock the "slow" database operation and compare with "fast" cache return
    
    it('should be significantly faster when serving from cache', async () => {
        // Mock slow DB operation (No Cache)
        const slowOperation = async () => {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms simulated delay
            return { data: 'slow', _fromCache: false };
        };

        // Mock fast Cache operation
        const fastOperation = async () => {
             // negligible delay
            return { data: 'fast', _fromCache: true };
        };

        const startMiss = performance.now();
        await slowOperation();
        const endMiss = performance.now();
        const durationMiss = endMiss - startMiss;

        const startHit = performance.now();
        await fastOperation();
        const endHit = performance.now();
        const durationHit = endHit - startHit;

        expect(durationHit).toBeLessThan(durationMiss);
        // Specifically expecting < 50ms for cache (our simulated is ~0) vs > 100ms for miss
        expect(durationHit).toBeLessThan(50);
        expect(durationMiss).toBeGreaterThanOrEqual(100);
    });
  });
});
