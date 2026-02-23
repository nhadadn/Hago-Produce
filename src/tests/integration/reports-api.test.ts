import { NextRequest } from 'next/server';
import { POST as REVENUE_POST } from '@/app/api/v1/reports/revenue/route';
import { POST as AGING_POST } from '@/app/api/v1/reports/aging/route';
import { POST as TOP_CUSTOMERS_POST } from '@/app/api/v1/reports/top/customers/route';
import { POST as TOP_PRODUCTS_POST } from '@/app/api/v1/reports/top/products/route';
import { POST as PRICE_TRENDS_POST } from '@/app/api/v1/reports/price-trends/route';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: () =>
    new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), {
      status: 401,
    }),
}));

jest.mock('@/lib/db', () => {
  const mockPrisma = {
    invoice: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
    invoiceItem: {
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    productPrice: {
      findMany: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('Reports API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /reports/revenue', () => {
    it('should enforce role-based access', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.CUSTOMER,
      });

      const req = new NextRequest('http://localhost/api/v1/reports/revenue', {
        method: 'POST',
        body: JSON.stringify({ startDate: '2024-01-01', endDate: '2024-01-31' }),
      });

      const res = await REVENUE_POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return revenue metrics for allowed roles', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.MANAGEMENT,
      });

      (prisma.invoice.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { total: 300 }, _avg: { total: 100 } })
        .mockResolvedValueOnce({ _sum: { total: 150 } });

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        { total: 100, issueDate: new Date('2024-01-05') },
        { total: 200, issueDate: new Date('2024-01-15') },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/revenue', {
        method: 'POST',
        body: JSON.stringify({ startDate: '2024-01-01', endDate: '2024-01-31' }),
      });

      const res = await REVENUE_POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.totalRevenue).toBe(300);
    });
  });

  describe('POST /reports/aging', () => {
    it('should return aging report for authenticated user', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.ADMIN,
      });

      const asOfDate = new Date('2024-02-01T00:00:00Z');

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        { total: 100, dueDate: new Date('2024-01-25T00:00:00Z') },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/aging', {
        method: 'POST',
        body: JSON.stringify({ asOfDate: asOfDate.toISOString() }),
      });

      const res = await AGING_POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.buckets)).toBe(true);
    });
  });

  describe('POST /reports/top/customers', () => {
    it('should return top customers for allowed roles', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.ACCOUNTING,
      });

      (prisma.invoice.groupBy as jest.Mock).mockResolvedValue([
        {
          customerId: 'cust-1',
          _sum: { total: 300 },
          _count: { id: 3 },
        },
      ]);

      (prisma.customer.findMany as jest.Mock).mockResolvedValue([
        { id: 'cust-1', name: 'Customer 1' },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/top/customers', {
        method: 'POST',
        body: JSON.stringify({ limit: 5 }),
      });

      const res = await TOP_CUSTOMERS_POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data[0].customerId).toBe('cust-1');
    });
  });

  describe('POST /reports/top/products', () => {
    it('should return top products for allowed roles', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.ADMIN,
      });

      (prisma.invoiceItem.groupBy as jest.Mock).mockResolvedValue([
        {
          productId: 'prod-1',
          _sum: { quantity: 10, totalPrice: 500 },
        },
      ]);

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod-1', name: 'Product 1' },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/top/products', {
        method: 'POST',
        body: JSON.stringify({ limit: 5 }),
      });

      const res = await TOP_PRODUCTS_POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data[0].productId).toBe('prod-1');
    });
  });

  describe('POST /reports/price-trends', () => {
    it('should return price trends for authenticated user', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.MANAGEMENT,
      });

      (prisma.productPrice.findMany as jest.Mock).mockResolvedValue([
        {
          productId: 'prod-1',
          supplierId: 'sup-1',
          costPrice: 10,
          sellPrice: 20,
          currency: 'USD',
          effectiveDate: new Date('2024-01-10T00:00:00Z'),
          isCurrent: true,
          source: 'manual',
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'sup-1',
            name: 'Supplier 1',
          },
        },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/price-trends', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', months: 3 }),
      });

      const res = await PRICE_TRENDS_POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.productId).toBe('prod-1');
    });
  });
});

