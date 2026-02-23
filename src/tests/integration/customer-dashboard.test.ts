import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/invoices/route';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { Role, InvoiceStatus } from '@prisma/client';
import prisma from '@/lib/db';

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

describe('Customer Dashboard Data - Invoices API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should only return invoices for authenticated customer', async () => {
    const mockCustomerId = 'cust-123';
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      role: Role.CUSTOMER,
      customerId: mockCustomerId,
    });

    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'inv-1',
        customerId: mockCustomerId,
        status: InvoiceStatus.PAID,
        total: 100,
      },
      {
        id: 'inv-2',
        customerId: mockCustomerId,
        status: InvoiceStatus.PENDING,
        total: 200,
      },
      {
        id: 'inv-3',
        customerId: mockCustomerId,
        status: InvoiceStatus.OVERDUE,
        total: 300,
      },
    ]);

    (prisma.invoice.count as jest.Mock).mockResolvedValue(3);

    const req = new NextRequest('http://localhost/api/v1/invoices?page=1&limit=100');
    await GET(req);

    expect(prisma.invoice.findMany as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customerId: mockCustomerId }),
      }),
    );
  });
});

