import { POST } from '@/app/api/v1/reports/top/customers/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn().mockReturnValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

jest.mock('@/lib/services/reports', () => ({
  getTopCustomers: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  getUserRateLimitKey: jest.fn().mockReturnValue('key'),
  isRateLimited: jest.fn().mockReturnValue(false),
}));

describe('POST /api/v1/reports/top/customers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns top customers for authorized admin', async () => {
    const mockUser = { userId: 'user-1', role: 'ADMIN' };
    require('@/lib/auth/middleware').getAuthenticatedUser.mockResolvedValue(mockUser);
    
    const mockData = [
      { customerId: 'c1', name: 'Cust 1', totalSpent: 5000 },
      { customerId: 'c2', name: 'Cust 2', totalSpent: 3000 }
    ];
    require('@/lib/services/reports').getTopCustomers.mockResolvedValue(mockData);

    const req = new NextRequest('http://localhost/api/v1/reports/top/customers', {
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
    
    const req = new NextRequest('http://localhost/api/v1/reports/top/customers', {
        method: 'POST',
        body: JSON.stringify({ limit: 5 })
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
