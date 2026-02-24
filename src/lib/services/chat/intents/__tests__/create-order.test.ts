import { jest } from '@jest/globals';
import prisma from '@/lib/db';
import { extractOrderParams, createOrderIntent } from '@/lib/services/chat/intents/create-order';

describe('create-order intent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const anyPrisma: any = prisma;
    anyPrisma.customer = anyPrisma.customer || {};
    anyPrisma.product = anyPrisma.product || {};
    anyPrisma.customer.findMany = jest.fn();
    anyPrisma.product.findMany = jest.fn();
  });

  it('extracts order params with basic regex fallback when no API key', async () => {
    const message = 'Hola, para el cliente ACME quiero 10 kg de jitomate.';
    delete process.env.OPENAI_API_KEY;

    const result = await extractOrderParams(message, 'es');

    expect(result).not.toBeNull();
    expect(result?.customerName.length).toBeGreaterThan(0);
    expect(result?.items.length).toBeGreaterThan(0);
  });

  it('returns pending order without creating invoice', async () => {
    const message = 'Quiero 5 kg de manzana para el cliente ACME.';
    (prisma.customer.findMany as jest.Mock).mockResolvedValue([
      { id: 'cust-1', name: 'ACME', preferredChannel: 'email' },
    ]);
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Manzana',
        nameEs: 'Manzana',
        prices: [
          {
            id: 'price-1',
            costPrice: 10,
            sellPrice: 12,
            currency: 'USD',
            isCurrent: true,
          },
        ],
      },
    ]);

    const result = await createOrderIntent(
      { rawMessage: message },
      'es',
      0.9,
    );

    expect(result.intent).toBe('create_order');
    expect(result.data?.type).toBe('create_order');
    expect(result.data?.created).toBe(false);
    expect(result.data?.pendingOrder).toBeDefined();
    expect(result.data?.pendingOrder.customerId).toBe('cust-1');
    expect(result.data?.pendingOrder.items[0].productId).toBe('prod-1');
    expect(result.data?.pendingOrder.sendChannel).toBe('email');
  });
});
