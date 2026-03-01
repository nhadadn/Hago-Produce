import prisma from '../utils/db';
jest.unmock('@/lib/db');
import { createOrderIntent, confirmOrderIntent } from '@/lib/services/chat/intents/create-order';
import { resetDb } from '../utils/db';

// Mock external services that we don't want to hit
jest.mock('@/lib/services/chat/openai-client', () => ({
  classifyChatIntentWithOpenAI: jest.fn(),
  extractOrderParams: jest.fn().mockResolvedValue({
    customerName: 'Test Customer',
    items: [{ productName: 'Test Product', quantity: 5, unit: 'kg' }],
  }),
}));

describe('Integration: Create Order Flow', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully create an order in the database', async () => {
    // 1. Setup Data
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1234567890',
        isActive: true,
        taxId: '123456789', // Required unique field
      },
    });

    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        isActive: true,
      },
    });

    await prisma.productPrice.create({
      data: {
        productId: product.id,
        supplierId: (await prisma.supplier.create({ data: { name: 'Test Supplier' } })).id,
        costPrice: 8.0,
        sellPrice: 10.5,
        currency: 'USD',
        effectiveDate: new Date(),
        isCurrent: true,
      },
    });

    // 2. Execute Logic
    // Simulate confirming an order
    const context = {
      pendingOrder: {
        customerId: customer.id,
        customerName: customer.name,
        items: [
          {
            productId: product.id,
            productName: 'Test Product',
            quantity: 5,
            unit: 'kg',
            unitPrice: 10.5,
            totalPrice: 52.5,
          },
        ],
        subtotal: 52.5,
        taxRate: 0.13,
        taxAmount: 6.825,
        total: 59.325,
        sendChannel: 'whatsapp',
      },
    };

    const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

    // 3. Verify Result
    expect(result.data.success).toBe(true);

    // 4. Verify Database State
    const invoice = await prisma.invoice.findFirst({
      where: { customerId: customer.id },
      include: { items: true },
    });

    expect(invoice).not.toBeNull();
    expect(Number(invoice?.total)).toBeCloseTo(59.325, 2);
    expect(invoice?.items).toHaveLength(1);
    expect(invoice?.items[0].productId).toBe(product.id);
    expect(Number(invoice?.items[0].quantity)).toBe(5);
  });

  it('should atomically rollback if item creation fails (transaction test)', async () => {
    // 1. Setup Customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Transaction Test Customer',
        email: 'trans@example.com',
        taxId: '999999999',
      },
    });

    // 2. Prepare Context with INVALID Product ID
    const context = {
      pendingOrder: {
        customerId: customer.id,
        customerName: customer.name,
        items: [
          {
            productId: 'invalid-uuid-that-does-not-exist', // This should cause FK failure
            productName: 'Ghost Product',
            quantity: 1,
            unit: 'kg',
            unitPrice: 10,
            totalPrice: 10,
          },
        ],
        subtotal: 10,
        taxRate: 0.13,
        taxAmount: 1.3,
        total: 11.3,
        sendChannel: 'whatsapp',
      },
    };

    // 3. Execute - Expect Failure
    // confirmOrderIntent catches errors and returns success: false
    const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

    expect(result.data.success).toBe(false);
    expect(result.data.reason).toBe('internal_error');

    // 4. Verify Database State - NO Invoice should exist for this customer
    const invoice = await prisma.invoice.findFirst({
      where: { customerId: customer.id },
    });

    expect(invoice).toBeNull();
  });

  it('should fail if customer does not exist (even if mocked extraction says so)', async () => {
     // We don't create any customer in DB
     
     const params = {
        customerName: 'Non Existent',
        items: [{ productName: 'Test Product', quantity: 1, unit: 'kg' }]
     };
     
     // This will use the real createOrderIntent which queries DB
     const result = await createOrderIntent(params, 'es', 1.0);
     
     expect(result.data.reason).toBe('customer_not_found');
  });
});
