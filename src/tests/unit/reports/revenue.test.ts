import { POST } from '@/app/api/v1/reports/revenue/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn().mockReturnValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

jest.mock('@/lib/services/reports', () => ({
  getRevenueMetrics: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  getUserRateLimitKey: jest.fn().mockReturnValue('key'),
  isRateLimited: jest.fn().mockReturnValue(false),
}));

describe('POST /api/v1/reports/revenue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns revenue data for authorized admin', async () => {
    // Mock auth
    const mockUser = { userId: 'user-1', role: 'ADMIN' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    // Mock service
    const mockMetrics = { 
      totalRevenue: 10000, 
      periodComparison: 15,
      _fromCache: false 
    };
    require('@/lib/services/reports').getRevenueMetrics.mockResolvedValue(mockMetrics);

    const req = new NextRequest('http://localhost/api/v1/reports/revenue', {
      method: 'POST',
      body: JSON.stringify({ startDate: '2026-01-01', endDate: '2026-01-31' })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockMetrics);
  });

  it('returns 403 for unauthorized role', async () => {
    const mockUser = { userId: 'user-2', role: 'CUSTOMER' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    const req = new NextRequest('http://localhost/api/v1/reports/revenue', {
        method: 'POST',
        body: JSON.stringify({ startDate: '2026-01-01', endDate: '2026-01-31' })
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('validates date range', async () => {
    const mockUser = { userId: 'user-1', role: 'ADMIN' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    // End date before start date
    const req = new NextRequest('http://localhost/api/v1/reports/revenue', {
      method: 'POST',
      body: JSON.stringify({ startDate: '2026-02-01', endDate: '2026-01-01' })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
