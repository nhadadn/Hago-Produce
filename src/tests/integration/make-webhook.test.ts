import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/webhooks/make/route';
import prisma from '@/lib/db';

jest.mock('@/lib/db', () => {
  const mockPrisma = {
    product: {
      findFirst: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    productPrice: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    webhookLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((arg: any) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      return Promise.resolve(arg);
    }),
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('POST /api/v1/webhooks/make', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, MAKE_WEBHOOK_API_KEY: 'test-make-key' } as any;
  });

  afterAll(() => {
    process.env = originalEnv as any;
  });

  it('rejects requests with invalid API key', async () => {
    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: {
        'x-api-key': 'invalid',
      } as any,
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('accepts Make.com-style price.updated payload with names and creates price', async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'prod-1' });
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'sup-1' });
    (prisma.productPrice.updateMany as jest.Mock).mockResolvedValue({});
    (prisma.productPrice.create as jest.Mock).mockResolvedValue({ id: 'price-1' });

    const payload = {
      eventType: 'price.updated',
      data: {
        product_name: 'Manzana Gala',
        supplier_name: 'Frutas Selectas',
        cost_price: 18,
        sell_price: 22,
        currency: 'CAD',
        effective_date: '2024-01-01',
        source: 'make_automation',
      },
      timestamp: new Date().toISOString(),
      idempotencyKey: 'file1_Manzana_2024-01-01',
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-make-key',
      } as any,
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.eventType).toBe('price.updated');
    expect(prisma.product.findFirst).toHaveBeenCalled();
    expect(prisma.supplier.findUnique).toHaveBeenCalled();
    expect(prisma.productPrice.create).toHaveBeenCalled();
  });
});

