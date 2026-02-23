import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/invoices/route';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';
import prisma from '@/lib/db';

// Mock DB
jest.mock('@/lib/db', () => {
  const mockPrisma = {
    invoice: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 }),
}));

describe('Customer Portal - Invoices API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should restrict CUSTOMER to their own invoices', async () => {
    const mockCustomerId = 'cust-123';
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ 
      userId: 'user-1', 
      role: Role.CUSTOMER,
      customerId: mockCustomerId
    });

    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.invoice.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/v1/invoices');
    await GET(req);

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        customerId: mockCustomerId
      })
    }));
  });

  it('should deny CUSTOMER without customerId', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ 
      userId: 'user-2', 
      role: Role.CUSTOMER,
      customerId: undefined
    });

    const req = new NextRequest('http://localhost/api/v1/invoices');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('should NOT restrict ADMIN to specific customer', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ 
      userId: 'admin-1', 
      role: Role.ADMIN 
    });

    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.invoice.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/v1/invoices');
    await GET(req);

    // Should NOT have customerId in where clause (unless passed in query params, which it isn't here)
    // Actually, findMany might have an empty where or specific filters, but definitely not forced customerId from user
    const callArgs = (prisma.invoice.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.customerId).toBeUndefined();
  });
});
