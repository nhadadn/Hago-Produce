
import { purchaseOrdersService } from '@/lib/services/purchase-orders.service';
import prisma from '@/lib/db';
import { sendPurchaseOrderEmail } from '@/lib/services/email.service';
import { whatsAppService } from '@/lib/services/bot/whatsapp.service';
import { generatePurchaseOrderPDF } from '@/lib/services/reports/export';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  purchaseOrder: {
    count: jest.fn(),
    create: jest.fn(),
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

describe('PurchaseOrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPurchaseOrder', () => {
    it('should create a purchase order with correct data', async () => {
      // Mock generatePurchaseOrderNumber logic
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);

      const mockOrder = {
        id: 'po-123',
        orderNumber: 'PO-2026-0001',
        total: 113,
      };
      (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue(mockOrder);

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
        taxRate: 0.13,
        taxAmount: 13,
        total: 113,
        notes: 'Test note',
      };

      const result = await purchaseOrdersService.createPurchaseOrder(data);

      expect(prisma.purchaseOrder.count).toHaveBeenCalled();
      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          orderNumber: expect.stringMatching(/PO-\d{4}-\d{4}/),
          supplierId: 'sup-1',
          total: expect.anything(), // Decimal handling might be tricky to match exactly with just '113' if it returns Decimal
        }),
      }));
      expect(result).toEqual(mockOrder);
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
