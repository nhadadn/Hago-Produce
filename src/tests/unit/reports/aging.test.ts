import { POST } from '@/app/api/v1/reports/aging/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn().mockReturnValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

jest.mock('@/lib/services/reports', () => ({
  getAgingReport: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  getUserRateLimitKey: jest.fn().mockReturnValue('key'),
  isRateLimited: jest.fn().mockReturnValue(false),
}));

describe('POST /api/v1/reports/aging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns aging data for authenticated user', async () => {
    // Mock auth
    const mockUser = { userId: 'user-1', role: 'ADMIN' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    // Mock service
    const mockReport = { 
      totalOverdue: 1000, 
      buckets: { '0-30': 500, '31-60': 500 },
      _fromCache: false 
    };
    require('@/lib/services/reports').getAgingReport.mockResolvedValue(mockReport);

    const req = new NextRequest('http://localhost/api/v1/reports/aging', {
      method: 'POST',
      body: JSON.stringify({ asOfDate: '2026-01-01' })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockReport);
    expect(res.headers.get('X-Cache')).toBe('MISS');
  });

  it('returns 401 for unauthenticated request', async () => {
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(null);
    
    const req = new NextRequest('http://localhost/api/v1/reports/aging', {
        method: 'POST',
        body: JSON.stringify({})
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('validates request body', async () => {
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue({ userId: 'user-1', role: 'ADMIN' });
    
    const req = new NextRequest('http://localhost/api/v1/reports/aging', {
      method: 'POST',
      body: JSON.stringify({ asOfDate: 'invalid-date' })
    });
    // Assuming schema validation fails or service handles it. 
    // The route uses agingReportSchema.safeParse.
    // Let's assume 'invalid-date' might pass as string but fail if logic checks it, or schema requires specific format.
    // If schema expects string that can be date, 'invalid-date' might be valid string but invalid date.
    // The route does: const asOf = asOfDate ? new Date(asOfDate) : new Date(); if (Number.isNaN(asOf.getTime())) ...
    
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
