
import { POST } from '@/app/api/v1/product-prices/bulk-update/route';
import { NextRequest } from 'next/server';
jest.unmock('@/lib/db');
import prisma, { resetDb } from '@/tests/integration/utils/db';
import { logger } from '@/lib/logger/logger.service';
import { Role } from '@prisma/client';

// Mock logger to verify error logging
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock auth middleware
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn((msg) => new Response(JSON.stringify({ error: msg }), { status: 401 })),
}));

import { getAuthenticatedUser } from '@/lib/auth/middleware';

describe('Product Prices Bulk Update (Real DB Integration)', () => {
  beforeEach(async () => {
    await resetDb();
    jest.clearAllMocks();
  });

  it('should process mixed valid and invalid items with proper error logging', async () => {
    // 1. Setup: Create a product
    const product = await prisma.product.create({
      data: {
        name: 'TestProduct',
        unit: 'kg',
      },
    });

    // 2. Setup: Authenticate as ADMIN
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ 
      userId: 'admin-1', 
      role: Role.ADMIN 
    });

    // 3. Prepare Request with 1 valid and 1 invalid item
    // The invalid item has cost_price as text that results in NaN
    const body = {
      source: 'test-integration',
      prices: [
        {
          product_name: 'TestProduct',
          supplier_name: 'ValidSupplier',
          cost_price: 10.50,
          currency: 'USD'
        },
        {
          product_name: 'TestProduct',
          supplier_name: 'ErrorSupplier',
          cost_price: 'invalid-number', // causes NaN in Service
          currency: 'USD'
        }
      ]
    };

    const req = new NextRequest('http://localhost/api/v1/product-prices/bulk-update', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // 4. Execute
    const res = await POST(req);
    const json = await res.json();

    // 5. Verify Response
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    
    // Check processing stats
    expect(json.data.processed).toBe(2);
    expect(json.data.created).toBe(1); // One succeeded
    expect(json.data.errors).toBe(1); // One failed

    // Verify DB state
    const prices = await prisma.productPrice.findMany({
      where: { productId: product.id },
      include: { supplier: true }
    });
    expect(prices).toHaveLength(1);
    expect(prices[0].supplier.name).toBe('ValidSupplier');
    expect(Number(prices[0].costPrice)).toBe(10.50);

    // Verify Logger was called
    expect(logger.error).toHaveBeenCalledTimes(1);
    // The service logs: `Error processing bulk update item for product: ${item.product_name}`
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error processing bulk update item for product: TestProduct'),
      expect.anything()
    );
  });
});
