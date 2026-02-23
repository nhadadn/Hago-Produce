import { executeQuery } from '@/lib/services/chat/query-executor';
import { DetectedIntent } from '@/lib/chat/types';

jest.mock('@/lib/db', () => ({
  productPrice: {
    findMany: jest.fn(),
  },
  invoice: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
}));

const prisma = jest.requireMock('@/lib/db');

describe('chat query executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes price_lookup and returns items', async () => {
    (prisma.productPrice.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'pp-1',
        productId: 'p-1',
        supplierId: 's-1',
        costPrice: 10,
        sellPrice: 12,
        currency: 'USD',
        effectiveDate: new Date('2024-01-01'),
        product: { id: 'p-1', name: 'Apple', nameEs: 'Manzana' },
        supplier: { id: 's-1', name: 'Supplier 1' },
      },
    ]);

    const detected: DetectedIntent = {
      intent: 'price_lookup',
      confidence: 0.9,
      params: { searchTerm: 'apple' },
    };

    const result = await executeQuery(detected, 'en');

    expect(result.intent).toBe('price_lookup');
    expect(result.data.items).toHaveLength(1);
    expect(result.sources).toHaveLength(1);
  });

  it('executes invoice_status and returns not found when no invoice', async () => {
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(null);

    const detected: DetectedIntent = {
      intent: 'invoice_status',
      confidence: 0.9,
      params: { invoiceNumber: 'INV-999' },
    };

    const result = await executeQuery(detected, 'es');

    expect(result.intent).toBe('invoice_status');
    expect(result.data.invoice).toBeNull();
  });
});

