
import { purchaseOrdersService } from '@/lib/services/purchase-orders.service';
import prisma from '@/lib/db';
import { sendPurchaseOrderEmail } from '@/lib/services/email.service';
import { whatsAppService } from '@/lib/services/bot/whatsapp.service';
import { generatePurchaseOrderPDF } from '@/lib/services/reports/export';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  purchaseOrder: {
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  supplier: {
    findUnique: jest.fn(),
  },
  notificationLog: {
    create: jest.fn(),
  },
}));

jest.mock('@/lib/services/email.service', () => ({
  sendPurchaseOrderEmail: jest.fn(),
}));

jest.mock('@/lib/services/bot/whatsapp.service', () => ({
  whatsAppService: {
    sendMessage: jest.fn(),
  },
}));

jest.mock('@/lib/services/reports/export', () => ({
  generatePurchaseOrderPDF: jest.fn(),
}));

jest.mock('@/lib/services/notifications/notification-log.service', () => ({
  createNotificationLog: jest.fn(),
}));

// Mock Logger
jest.mock('@/lib/logger/logger.service', () => ({
  __esModule: true,
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Tax Calculation
jest.mock('@/lib/services/finance/tax-calculation.service', () => ({
  __esModule: true,
  TransactionType: { PURCHASE: 'PURCHASE' },
  extractProvinceFromAddress: jest.fn(),
  taxCalculationService: {
    calculateTax: jest.fn(),
  },
}));

import { extractProvinceFromAddress, taxCalculationService } from '@/lib/services/finance/tax-calculation.service';
import { logger } from '@/lib/logger/logger.service';

describe('PurchaseOrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePurchaseOrderPDF', () => {
    it('throws error if order not found', async () => {
      (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(purchaseOrdersService.generatePurchaseOrderPDF('po-999'))
        .rejects.toThrow('Purchase Order not found: po-999');
    });

    it('generates PDF successfully', async () => {
      const mockOrder = {
          id: 'po-1',
          orderNumber: 'PO-001',
          supplier: { name: 'Sup A' },
          createdAt: new Date(),
          items: [
              { description: 'Item 1', quantity: 1, unit: 'kg', unitPrice: 10, totalPrice: 10 }
          ],
          subtotal: new Decimal(100),
          taxAmount: new Decimal(13),
          total: new Decimal(113)
      };
      (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (generatePurchaseOrderPDF as jest.Mock).mockResolvedValue(new Uint8Array([1]));

      const result = await purchaseOrdersService.generatePurchaseOrderPDF('po-1');
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('createPurchaseOrder', () => {
    it('should calculate taxAmount and total if only taxRate is provided', async () => {
        (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);
        (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue({ id: 'new' });

        const data = {
            supplierId: 'sup-1',
            items: [],
            subtotal: 100,
            taxRate: 0.10,
            // taxAmount missing
            // total missing
        };

        await purchaseOrdersService.createPurchaseOrder(data);

        expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                taxRate: new Decimal(0.10),
                taxAmount: new Decimal(10), // 100 * 0.10
                total: new Decimal(110)     // 100 + 10
            })
        }));
    });

    it('should create a purchase order with correct data and auto-calculated tax', async () => {
      // Mock generatePurchaseOrderNumber logic
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);

      const mockOrder = {
        id: 'po-123',
        orderNumber: 'PO-2026-0001',
        total: new Decimal(113),
      };
      (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue(mockOrder);
      
      // Mock Supplier for address
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ address: 'Vancouver, BC' });
      (extractProvinceFromAddress as jest.Mock).mockReturnValue('BC');
      
      const taxResult = {
        taxRate: new Decimal(0.05),
        taxAmount: new Decimal(5),
        breakdown: { gst: 5, pst: 0, hst: 0, qst: 0 }
      };
      (taxCalculationService.calculateTax as jest.Mock).mockReturnValue(taxResult);

      const data = {
        supplierId: 'sup-1',
        items: [
          {
            productId: 'prod-1',
            description: 'Test Product',
            quantity: 10,
            unit: 'kg',
            unitPrice: 10,
            totalPrice: 100,
          },
        ],
        subtotal: 100,
        // taxRate, taxAmount, total missing
        notes: 'Test note',
      };

      const result = await purchaseOrdersService.createPurchaseOrder(data);

      expect(prisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        select: { address: true },
      });
      expect(extractProvinceFromAddress).toHaveBeenCalledWith('Vancouver, BC');
      expect(taxCalculationService.calculateTax).toHaveBeenCalledWith('BC', expect.anything(), 'PURCHASE');
      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          subtotal: expect.any(Decimal),
          taxRate: expect.any(Decimal),
          taxAmount: expect.any(Decimal),
          total: expect.any(Decimal),
        }),
      }));
    });

    it('uses fallback Ontario (13%) when supplier address/province is invalid', async () => {
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ address: null });
      (extractProvinceFromAddress as jest.Mock).mockReturnValue(null);

      const taxResult = {
        taxRate: new Decimal(0.13),
        taxAmount: new Decimal(130),
        breakdown: { gst: 0, pst: 0, hst: 130, qst: 0 }
      };
      (taxCalculationService.calculateTax as jest.Mock).mockReturnValue(taxResult);

      const data = {
        supplierId: 'sup-1',
        items: [],
        subtotal: 1000,
      };

      const createdPO = {
        id: 'po-fallback',
        orderNumber: 'PO-2026-0001',
        subtotal: new Decimal(1000),
        taxRate: new Decimal(0.13),
        taxAmount: new Decimal(130),
        total: new Decimal(1130),
      };

      (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue(createdPO);

      await purchaseOrdersService.createPurchaseOrder(data);

      expect(prisma.supplier.findUnique).toHaveBeenCalled();
      expect(extractProvinceFromAddress).toHaveBeenCalled();
      expect(taxCalculationService.calculateTax).toHaveBeenCalledWith(null, expect.anything(), 'PURCHASE'); // Called with null!

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          taxRate: new Decimal(0.13),
        }),
      }));
    });

    it('should create a purchase order with provided taxRate (backward compatibility)', async () => {
      // Mock generatePurchaseOrderNumber logic
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);

      const mockOrder = {
        id: 'po-124',
        orderNumber: 'PO-2026-0002',
        total: new Decimal(113),
      };
      (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue(mockOrder);

      const data = {
        supplierId: 'sup-1',
        items: [],
        subtotal: 100,
        taxRate: 0.13, // Provided explicitly
        notes: 'Legacy tax rate',
      };

      const result = await purchaseOrdersService.createPurchaseOrder(data);

      expect(prisma.supplier.findUnique).not.toHaveBeenCalled(); // Should skip lookup
      expect(extractProvinceFromAddress).not.toHaveBeenCalled();
      expect(taxCalculationService.calculateTax).not.toHaveBeenCalled();
      
      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          taxRate: new Decimal(0.13), // Should be passed as is (or Decimal equivalent)
          // taxAmount calculated internally based on rate
        }),
      }));
    });
  });

  describe('sendPurchaseOrderToSupplier', () => {
    const mockOrder = {
      id: 'po-123',
      orderNumber: 'PO-2026-0001',
      supplier: {
        id: 'sup-1',
        name: 'Supplier 1',
        email: 'supplier@test.com',
        phone: '1234567890',
      },
      items: [],
      subtotal: 100,
      taxAmount: 13,
      total: 113,
      createdAt: new Date(),
    };

    beforeEach(() => {
      (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (generatePurchaseOrderPDF as jest.Mock).mockReturnValue(new Uint8Array([1, 2, 3]));
    });

    it('should send email when channel is EMAIL', async () => {
      (sendPurchaseOrderEmail as jest.Mock).mockResolvedValue({ success: true, messageId: 'msg-1' });

      const result = await purchaseOrdersService.sendPurchaseOrderToSupplier('po-123', 'EMAIL');

      expect(prisma.purchaseOrder.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'po-123' } }));
      expect(generatePurchaseOrderPDF).toHaveBeenCalled();
      expect(sendPurchaseOrderEmail).toHaveBeenCalledWith(
        'supplier@test.com',
        'PO-2026-0001',
        expect.any(Buffer),
        'Supplier 1'
      );
      expect(result).toEqual({ success: true, messageId: 'msg-1', error: undefined });
    });

    it('should send whatsapp when channel is WHATSAPP', async () => {
      (whatsAppService.sendMessage as jest.Mock).mockResolvedValue('msg-wa-1');

      const result = await purchaseOrdersService.sendPurchaseOrderToSupplier('po-123', 'WHATSAPP');

      expect(whatsAppService.sendMessage).toHaveBeenCalledWith(
        '1234567890',
        expect.stringContaining('PO-2026-0001')
      );
      expect(result).toEqual({ success: true, messageId: 'msg-wa-1' });
    });

    it('should throw error if order not found', async () => {
      (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(purchaseOrdersService.sendPurchaseOrderToSupplier('po-123', 'EMAIL'))
        .rejects.toThrow('Purchase Order not found');
    });

    it('should return failure if phone missing for WHATSAPP channel', async () => {
        (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
            ...mockOrder,
            supplier: { ...mockOrder.supplier, phone: null }
        });
        (generatePurchaseOrderPDF as jest.Mock).mockReturnValue(new Uint8Array([1]));

        const result = await purchaseOrdersService.sendPurchaseOrderToSupplier('po-123', 'WHATSAPP');
        expect(result.success).toBe(false);
        // It returns success: false instead of throwing, because of the try-catch block in service
        // And logger.error should be called
        expect(logger.error).toHaveBeenCalled();
    });

    it('should throw error if email missing for EMAIL channel', async () => {
      (prisma.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrder,
        supplier: { ...mockOrder.supplier, email: null },
      });

      const result = await purchaseOrdersService.sendPurchaseOrderToSupplier('po-123', 'EMAIL');
      expect(result.success).toBe(false);
      // It returns success: false instead of throwing, because of the try-catch block in service
    });
  });
});
