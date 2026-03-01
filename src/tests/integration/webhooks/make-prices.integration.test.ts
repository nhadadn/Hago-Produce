import { POST } from '@/app/webhooks/make/prices/route';
jest.unmock('@/lib/db');
import prisma from '../utils/db'; // Utilities for DB reset
import { resetDb } from '../utils/db';
import { NextRequest } from 'next/server';

describe('Integration: Make.com Prices Webhook', () => {
  beforeEach(async () => {
    await resetDb();
    // Set API Key for test
    process.env.MAKE_WEBHOOK_SECRET = 'test-secret';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    delete process.env.MAKE_WEBHOOK_SECRET;
  });

  it('should reject requests without valid API key', async () => {
    const req = new NextRequest('http://localhost/webhooks/make/prices', {
      method: 'POST',
      body: JSON.stringify({ prices: [] }),
      headers: {
        'x-api-key': 'wrong-key',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should process valid payload and create prices', async () => {
    // 1. Setup Data: Create a Product
    const product = await prisma.product.create({
      data: {
        name: 'Banana',
        isActive: true,
      },
    });

    // 2. Prepare Request
    const payload = {
      source: 'Make',
      prices: [
        {
          product_name: 'Banana',
          supplier_name: 'Supplier A',
          cost_price: 10.5,
          currency: 'USD',
        },
      ],
    };

    const req = new NextRequest('http://localhost/webhooks/make/prices', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'x-api-key': 'test-secret',
      },
    });

    // 3. Execute Webhook
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.created).toBe(1);

    // 4. Verify DB
    // Check Supplier created
    const supplier = await prisma.supplier.findUnique({
      where: { name: 'Supplier A' },
    });
    expect(supplier).not.toBeNull();

    // Check Price created
    const price = await prisma.productPrice.findFirst({
      where: {
        productId: product.id,
        supplierId: supplier!.id,
      },
    });

    expect(price).not.toBeNull();
    expect(price!.costPrice.toNumber()).toBe(10.5); // Prisma Decimal
    expect(price!.isCurrent).toBe(true);
  });

  it('should handle product not found errors gracefully', async () => {
    const payload = {
      source: 'Make',
      prices: [
        {
          product_name: 'NonExistentProduct',
          supplier_name: 'Supplier B',
          cost_price: 20,
        },
      ],
    };

    const req = new NextRequest('http://localhost/webhooks/make/prices', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'x-api-key': 'test-secret',
      },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200); // Partial success is 200
    expect(body.data.errors).toBe(1);
    expect(body.data.details[0].message).toBe('Product not found');
  });
});
