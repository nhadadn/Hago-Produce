import { jest } from '@jest/globals';
import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { createPurchaseOrderIntent, extractPurchaseOrderParams, confirmPurchaseOrderIntent } from '../create-purchase-order';
import { logAudit } from '@/lib/audit/logger';
import { createNotificationLog } from '@/lib/services/notifications/notification-log.service';

// Mock dependencies
jest.mock('@/lib/services/chat/openai-client');

describe('create-purchase-order intent', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    
    // Spy on Prisma methods
    jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.purchaseOrder, 'count').mockResolvedValue(0);
    jest.spyOn(prisma.purchaseOrder, 'create').mockImplementation((args: any) => {
      return {
        id: 'po-123',
        orderNumber: args.data.orderNumber,
        total: args.data.total,
        supplier: {
          id: 'sup-1',
          name: 'Supplier 1',
          email: 'supplier@test.com',
          phone: '1234567890'
        },
        ...args.data
      } as any;
    });

    jest.spyOn(prisma.purchaseOrder, 'findUnique').mockImplementation(((args: any) => {
      if (args.where.id === 'po-123') {
        return Promise.resolve({
          id: 'po-123',
          orderNumber: 'PO-123',
          total: new Decimal(113),
          supplier: {
            id: 'sup-1',
            name: 'Supplier 1',
            email: 'supplier@test.com',
            phone: '1234567890'
          },
          items: [],
          deliveryDate: new Date(),
          createdAt: new Date(),
          // Add other necessary fields
        } as any);
      }
      return Promise.resolve(null);
    }) as any);
    // Mock Audit and Notification logs to avoid DB connection errors
    // Use any cast because property access on prisma client mock might be tricky with types
    (prisma as any).auditLog = { create: jest.fn<any>().mockResolvedValue({} as any) };
    (prisma as any).notificationLog = { create: jest.fn<any>().mockResolvedValue({} as any) };
  });

  describe('extractPurchaseOrderParams', () => {
    it('extracts params using regex fallback when API key is missing', async () => {
      const message = 'Quiero 10 kg de Tomate y 5 cajas de Lechuga';
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const result = await extractPurchaseOrderParams(message, 'es');

      process.env.OPENAI_API_KEY = originalApiKey;

      expect(result).not.toBeNull();
      expect(result?.items).toHaveLength(2);
      expect(result?.items[0]).toEqual({ productName: 'Tomate', quantity: 10, unit: 'kg' });
      expect(result?.items[1]).toEqual({ productName: 'Lechuga', quantity: 5, unit: 'box' });
    });
  });

  describe('createPurchaseOrderIntent', () => {
    it('returns missing_items if no items extracted', async () => {
      const result = await createPurchaseOrderIntent({}, 'es', 1.0, { message: { message: 'Hola' } } as any);
      expect(result.data?.reason).toBe('missing_items');
    });

    it('finds best suppliers and generates pending orders', async () => {
      // Mock Prisma Product lookup
      jest.spyOn(prisma.product, 'findMany').mockImplementation((async (args: any) => {
        // Safe check for where clause structure
        const where = args?.where;
        if (!where || !where.OR) return [];
        
        const nameFilter = where.OR[0]?.name?.contains;
        
        if (nameFilter === 'Tomate') {
          return [{
            id: 'prod-1',
            name: 'Tomate',
            prices: [{
              supplierId: 'sup-1',
              costPrice: new Decimal(10),
              currency: 'USD',
              isCurrent: true,
              supplier: { name: 'Supplier A' }
            }]
          }] as any;
        }
        if (nameFilter === 'Lechuga') {
          return [{
            id: 'prod-2',
            name: 'Lechuga',
            prices: [{
              supplierId: 'sup-2',
              costPrice: new Decimal(20),
              currency: 'USD',
              isCurrent: true,
              supplier: { name: 'Supplier B' }
            }]
          }] as any;
        }
        return [];
      }) as any);

      const params = {
        items: [
          { productName: 'Tomate', quantity: 10, unit: 'kg' },
          { productName: 'Lechuga', quantity: 5, unit: 'box' }
        ]
      };

      const result = await createPurchaseOrderIntent(params, 'es', 1.0);

      expect(result.data?.type).toBe('create_purchase_order');
      expect(result.data?.created).toBe(false);
      expect(result.data?.pendingOrders).toHaveLength(2);
      
      const orderA = result.data?.pendingOrders.find((o: any) => o.supplierName === 'Supplier A');
      expect(orderA).toBeDefined();
      expect(orderA.total).toBe(113); // 10 * 10 = 100 + 13% tax = 113

      const orderB = result.data?.pendingOrders.find((o: any) => o.supplierName === 'Supplier B');
      expect(orderB).toBeDefined();
      expect(orderB.total).toBe(113); // 5 * 20 = 100 + 13% tax = 113
    });

    it('handles products not found', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      const params = {
        items: [{ productName: 'Unicornio', quantity: 1, unit: 'unit' }]
      };

      const result = await createPurchaseOrderIntent(params, 'es', 1.0);

      expect(result.data?.reason).toBe('no_products_found');
      expect(result.data?.notFoundItems).toContain('Unicornio');
    });
  });

  describe('confirmPurchaseOrderIntent', () => {
    it('returns error if no pending orders in context', async () => {
      const result = await confirmPurchaseOrderIntent({}, 'es', 1.0, {});
      expect(result.data?.success).toBe(false);
      expect(result.data?.reason).toBe('no_pending_orders');
    });

    it('creates orders from pending orders context', async () => {
      const pendingOrders = [{
        supplierId: 'sup-1',
        supplierName: 'Supplier A',
        items: [{
          productId: 'prod-1',
          productName: 'Tomate',
          quantity: 10,
          unit: 'kg',
          unitPrice: 10,
          totalPrice: 100
        }],
        subtotal: 100,
        taxRate: 0.13,
        taxAmount: 13,
        total: 113,
        notes: 'Urgent'
      }];

      const context = {
        userId: 'user-1',
        pendingPurchaseOrders: pendingOrders
      };

      const result = await confirmPurchaseOrderIntent({}, 'es', 1.0, context as any);

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          supplierId: 'sup-1',
          total: new Decimal(113),
          notes: 'Urgent',
          status: 'SENT'
        })
      }));

      // Verify side effects via prisma calls instead of service mocks
      expect((prisma as any).auditLog.create).toHaveBeenCalled();
      expect((prisma as any).notificationLog.create).toHaveBeenCalled();

      expect(result.data?.success).toBe(true);
      expect(result.data?.createdOrders).toHaveLength(1);
      expect(result.data?.createdOrders[0].orderNumber).toMatch(/PO-\d{4}-\d{4}/);
    });
  });
});
