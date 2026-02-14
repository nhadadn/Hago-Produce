
import { GET, POST } from '@/app/api/v1/product-prices/route';
import { POST as BULK_POST } from '@/app/api/v1/product-prices/bulk-update/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth/middleware';

// Mock auth middleware
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

// Mock DB
jest.mock('@/lib/db', () => {
  const mockPrisma = {
    productPrice: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
    supplier: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((arg) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      if (typeof arg === 'function') return arg(mockPrisma);
      return Promise.resolve(arg);
    }),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('Product Prices API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /product-prices', () => {
    it('should allow ACCOUNTING role to view prices', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ACCOUNTING });
      (prisma.productPrice.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.productPrice.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest('http://localhost/api/v1/product-prices');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should forbid CUSTOMER role', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.CUSTOMER });

      const req = new NextRequest('http://localhost/api/v1/product-prices');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /product-prices', () => {
    it('should create price if ADMIN', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      (prisma.productPrice.create as jest.Mock).mockResolvedValue({
        id: '1',
        costPrice: 10,
        currency: 'USD',
      });
      (prisma.productPrice.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const req = new NextRequest('http://localhost/api/v1/product-prices', {
        method: 'POST',
        body: JSON.stringify({
          productId: '123e4567-e89b-12d3-a456-426614174000',
          supplierId: '123e4567-e89b-12d3-a456-426614174001',
          costPrice: 10,
          currency: 'USD',
          isCurrent: true,
          effectiveDate: '2024-01-01',
          source: 'manual',
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(prisma.productPrice.create).toHaveBeenCalled();
      // Should have called updateMany to set previous current to false
      expect(prisma.productPrice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            supplierId: '123e4567-e89b-12d3-a456-426614174001',
            isCurrent: true
          },
          data: { isCurrent: false },
        })
      );
    });
  });

  describe('POST /product-prices/bulk-update', () => {
    it('should process bulk updates', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      // Mock lookups
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174001' });
      (prisma.productPrice.create as jest.Mock).mockResolvedValue({ id: 'new' });

      const req = new NextRequest('http://localhost/api/v1/product-prices/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          source: 'manual_bulk',
          prices: [
            {
              product_name: 'Manzana',
              supplier_name: 'Frutas',
              cost_price: 20,
              currency: 'USD',
              effective_date: '2024-01-01',
            },
          ],
        }),
      });

      const res = await BULK_POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.processed).toBe(1);
      expect(prisma.productPrice.create).toHaveBeenCalled();
    });
  });
});
