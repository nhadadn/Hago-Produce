import { POST } from '@/app/api/v1/reports/top/products/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn().mockReturnValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

jest.mock('@/lib/services/reports', () => ({
  getTopProducts: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  getUserRateLimitKey: jest.fn().mockReturnValue('key'),
  isRateLimited: jest.fn().mockReturnValue(false),
}));

describe('POST /api/v1/reports/top/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns top products for authorized admin', async () => {
    const mockUser = { userId: 'user-1', role: 'ADMIN' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    const mockData = [
      { productId: 'p1', name: 'Prod 1', totalSold: 500 },
      { productId: 'p2', name: 'Prod 2', totalSold: 300 }
    ];
    require('@/lib/services/reports').getTopProducts.mockResolvedValue(mockData);

    const req = new NextRequest('http://localhost/api/v1/reports/top/products', {
      method: 'POST',
      body: JSON.stringify({ limit: 5 })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockData);
  });

  it('returns 403 for unauthorized role', async () => {
    const mockUser = { userId: 'user-2', role: 'CUSTOMER' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    const req = new NextRequest('http://localhost/api/v1/reports/top/products', {
        method: 'POST',
        body: JSON.stringify({ limit: 5 })
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
