import prisma from '@/lib/db';
import { createOrderIntent } from '@/lib/services/chat/intents/create-order';
import { customerBalanceIntent } from '@/lib/services/chat/intents/customer-balance';
import { inventorySummaryIntent } from '@/lib/services/chat/intents/inventory-summary';
import { invoiceStatusIntent } from '@/lib/services/chat/intents/invoice-status';

jest.mock('@/lib/db', () => {
  const mockPrisma = {
    customer: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    notificationLog: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

const db = prisma as any;

describe('chat intents business logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrderIntent', () => {
    it('returns missing_customer_or_items when customer or items are missing', async () => {
      const result = await createOrderIntent({}, 'es', 0.8);

      expect(result.data.created).toBe(false);
      expect(result.data.reason).toBe('extraction_failed');
    });

    it('returns customer_not_found when customer does not exist', async () => {
      db.customer.findMany.mockResolvedValueOnce([]);

      const result = await createOrderIntent(
        {
          customerName: 'Cliente X',
          items: [{ productName: 'Manzana', quantity: 1 }],
        },
        'es',
        0.9,
      );

      expect(db.customer.findMany).toHaveBeenCalled();
      expect(result.data.created).toBe(false);
      expect(result.data.reason).toBe('customer_not_found');
    });

    it('returns product_not_found when any product is missing', async () => {
      db.customer.findMany.mockResolvedValueOnce([{ id: 'cust-1', name: 'Cliente' }]);
      db.product.findMany.mockResolvedValueOnce([]);

      const result = await createOrderIntent(
        {
          customerName: 'Cliente',
          items: [{ productName: 'Manzana', quantity: 2 }],
        },
        'es',
        0.9,
      );

      expect(db.product.findMany).toHaveBeenCalled();
      expect(result.data.created).toBe(false);
      expect(result.data.reason).toBe('product_not_found');
    });

    it('returns pending order when customer and products exist', async () => {
      db.customer.findMany.mockResolvedValueOnce([{ id: 'cust-1', name: 'Cliente' }]);
      db.product.findMany
        .mockResolvedValueOnce([
          {
            id: 'prod-1',
            name: 'Producto 1',
            prices: [{ amount: 10, isCurrent: true, sellPrice: 10 }],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'prod-2',
            name: 'Producto 2',
            prices: [{ amount: 20, isCurrent: true, sellPrice: 20 }],
          },
        ]);

      const result = await createOrderIntent(
        {
          customerName: 'Cliente',
          items: [
            { productName: 'Producto 1', quantity: 1 },
            { productName: 'Producto 2', quantity: 3 },
          ],
        },
        'es',
        0.95,
      );

      expect(db.invoice.create).not.toHaveBeenCalled();
      expect(result.data.created).toBe(false);
      expect(result.data.pendingOrder).toBeDefined();
      expect(result.data.pendingOrder.customerId).toBe('cust-1');
      expect(result.data.pendingOrder.items).toHaveLength(2);
      expect(result.data.pendingOrder.total).toBeGreaterThan(0);
    });
  });

  describe('customerBalanceIntent', () => {
    it('aggregates outstanding invoices by customer', async () => {
      db.invoice.findMany.mockResolvedValueOnce([
        {
          id: 'inv-1',
          customerId: 'cust-1',
          total: 100,
          customer: { id: 'cust-1', name: 'Cliente 1' },
        },
        {
          id: 'inv-2',
          customerId: 'cust-1',
          total: 200,
          customer: { id: 'cust-1', name: 'Cliente 1' },
        },
      ]);

      const result = await customerBalanceIntent({}, 'es', 0.9);

      expect(db.invoice.findMany).toHaveBeenCalled();
      expect(result.data.totalOutstanding).toBe(300);
      expect(result.data.invoicesCount).toBe(2);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].customerName).toBe('Cliente 1');
      expect(result.sources.length).toBe(2);
    });
  });

  describe('inventorySummaryIntent', () => {
    it('builds inventory summary grouped by category', async () => {
      db.product.findMany.mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'Producto 1',
          category: 'Frutas',
          prices: [
            { sellPrice: 10, costPrice: 8 },
            { sellPrice: 12, costPrice: 9 },
          ],
        },
        {
          id: 'p2',
          name: 'Producto 2',
          category: null,
          prices: [{ sellPrice: null, costPrice: 5 }],
        },
      ]);

      const result = await inventorySummaryIntent({}, 'es', 0.9);

      expect(db.product.findMany).toHaveBeenCalled();
      expect(result.data.items.length).toBeGreaterThanOrEqual(1);
      const frutas = result.data.items.find((i: any) => i.category === 'Frutas');
      expect(frutas.products[0].minPrice).toBe(10);
      expect(frutas.products[0].maxPrice).toBe(12);
      expect(result.sources.length).toBe(2);
    });
  });

  describe('invoiceStatusIntent', () => {
    it('returns empty result when no invoiceNumber or searchTerm provided', async () => {
      const result = await invoiceStatusIntent({}, 'es', 0.8);

      expect(result.data.invoice).toBeNull();
      expect(result.sources.length).toBe(0);
    });

    it('returns invoice details when found by number', async () => {
      db.invoice.findFirst.mockResolvedValueOnce({
        id: 'inv-1',
        number: 'INV-001',
        status: 'PENDING',
        total: 150,
        issueDate: new Date('2024-01-01T00:00:00Z'),
        dueDate: new Date('2024-01-15T00:00:00Z'),
        customerId: 'cust-1',
        customer: { id: 'cust-1', name: 'Cliente 1' },
      });

      const result = await invoiceStatusIntent(
        { invoiceNumber: 'INV-001' },
        'es',
        0.9,
      );

      expect(db.invoice.findFirst).toHaveBeenCalled();
      expect(result.data.invoice).not.toBeNull();
      expect(result.data.invoice.number).toBe('INV-001');
      expect(result.sources.length).toBe(2);
    });

    it('returns not found payload when invoice does not exist', async () => {
      db.invoice.findFirst.mockResolvedValueOnce(null);

      const result = await invoiceStatusIntent(
        { invoiceNumber: 'INV-404' },
        'es',
        0.7,
      );

      expect(result.data.invoice).toBeNull();
      expect(result.data.invoiceNumber).toBe('INV-404');
      expect(result.sources.length).toBe(0);
    });
  });
});

