import { POST } from '@/app/api/v1/reports/export/csv/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn().mockReturnValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

jest.mock('@/lib/services/reports', () => ({
  getRevenueMetrics: jest.fn(),
  getAgingReport: jest.fn(),
  getTopCustomers: jest.fn(),
  getTopProducts: jest.fn(),
  getProductPriceTrends: jest.fn(),
}));

jest.mock('@/lib/services/reports/export', () => ({
  buildCSV: jest.fn().mockReturnValue({ buffer: Buffer.from('csv-content'), filename: 'report.csv' }),
  ReportType: { REVENUE: 'revenue', AGING: 'aging' } // Mock enum if needed, or just pass strings
}));

jest.mock('@/lib/rate-limit', () => ({
  getUserRateLimitKey: jest.fn().mockReturnValue('key'),
  isRateLimited: jest.fn().mockReturnValue(false),
}));

describe('POST /api/v1/reports/export/csv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports revenue CSV for authorized admin', async () => {
    const mockUser = { userId: 'user-1', role: 'ADMIN' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    require('@/lib/services/reports').getRevenueMetrics.mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/v1/reports/export/csv', {
      method: 'POST',
      body: JSON.stringify({ 
        reportType: 'revenue', 
        filters: { startDate: '2026-01-01', endDate: '2026-01-31' } 
      })
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
  });

  it('returns 400 if required filters missing', async () => {
    const mockUser = { userId: 'user-1', role: 'ADMIN' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);

    const req = new NextRequest('http://localhost/api/v1/reports/export/csv', {
      method: 'POST',
      body: JSON.stringify({ 
        reportType: 'revenue', 
        filters: {} // Missing dates
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
