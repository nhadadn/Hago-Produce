
import { 
  extractOrderParams, 
  createOrderIntent, 
  confirmOrderIntent 
} from '@/lib/services/chat/intents/create-order';
import prisma from '@/lib/db';
import { InvoicesService } from '@/lib/services/invoices.service';
import { generateInvoicePDF } from '@/lib/services/reports/export';
import { sendInvoiceEmail } from '@/lib/services/email.service';
import { createNotificationLog } from '@/lib/services/notifications/notification-log.service';
import { sendInvoiceDocument } from '@/lib/services/telegram.service';
import { WhatsAppService } from '@/lib/services/bot/whatsapp.service';
import { logAudit } from '@/lib/audit/logger';

// Mocks
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    customer: { findMany: jest.fn(), findUnique: jest.fn() },
    product: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/services/invoices.service');
jest.mock('@/lib/services/reports/export');
jest.mock('@/lib/services/email.service');
jest.mock('@/lib/services/notifications/notification-log.service');
jest.mock('@/lib/services/telegram.service');
jest.mock('@/lib/services/bot/whatsapp.service');
jest.mock('@/lib/audit/logger');

// Global fetch mock for OpenAI
global.fetch = jest.fn();

describe('Create Order Intent', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('extractOrderParams', () => {
    const mockOpenAIResponse = (toolCallArgs: any) => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  type: 'function',
                  function: {
                    arguments: JSON.stringify(toolCallArgs),
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    it('should extract parameters using OpenAI successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockOpenAIResponse({
          customer_name: 'Juan Perez',
          items: [{ product_name: 'Tomate', quantity: 10, unit: 'kg' }],
          send_channel: 'whatsapp',
        })
      );

      const result = await extractOrderParams('Quiero 10kg de tomate para Juan Perez por whatsapp', 'es');

      expect(result).toEqual({
        customerName: 'Juan Perez',
        items: [{ productName: 'Tomate', quantity: 10, unit: 'kg' }],
        sendChannel: 'whatsapp',
        notes: undefined,
        deliveryDate: undefined,
        deliveryTime: undefined,
      });
    });

    it('should fallback to regex if OpenAI fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      // Use comma to terminate product name capture in regex
      const result = await extractOrderParams('Hola, quiero 5 cajas de Banano, para Maria', 'es');

      expect(result).not.toBeNull();
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0]).toEqual({ productName: 'Banano', quantity: 5, unit: 'box' });
    });

    it('should fallback to regex if OpenAI returns invalid JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { tool_calls: [{ function: { arguments: '{invalid' } }] } }],
        }),
      });

      const result = await extractOrderParams('10 lbs de Papa', 'es');
      expect(result).not.toBeNull();
      expect(result?.items[0].productName).toBe('Papa');
    });

    it('should return null if empty message', async () => {
      const result = await extractOrderParams('   ', 'es');
      expect(result).toBeNull();
    });

    it('should use regex directly if no API key', async () => {
      process.env.OPENAI_API_KEY = '';
      // Regex requires " de "
      const result = await extractOrderParams('10 kg de Manzana', 'es');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result?.items[0].productName).toBe('Manzana');
    });
  });

  describe('createOrderIntent', () => {
    it('should use provided params if available', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Cliente 1' }]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'p1', name: 'Producto 1', prices: [{ sellPrice: 100, isCurrent: true }] },
      ]);

      const params = {
        customerName: 'Cliente 1',
        items: [{ productName: 'Producto 1', quantity: 1, unit: 'unit' }],
      };

      const result = await createOrderIntent(params, 'es', 1.0);
      
      expect(result.data.type).toBe('create_order');
      expect(result.data.created).toBe(false); // Pending order created, not finalized
      expect(result.data.pendingOrder).toBeDefined();
      expect(result.data.pendingOrder.total).toBeGreaterThan(0);
    });

    it('should return customer_not_found if no customer matches', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);
      
      // Must provide items to bypass extraction check
      const params = { 
        customerName: 'Unknown', 
        items: [{ productName: 'Prod', quantity: 1, unit: 'kg' }] 
      };
      const result = await createOrderIntent(params, 'es', 1.0);

      expect(result.data.reason).toBe('customer_not_found');
    });

    it('should return multiple_customers if ambiguous', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([
        { id: 'c1', name: 'Juan A' },
        { id: 'c2', name: 'Juan B' },
      ]);
      
      // Must provide items to bypass extraction check
      const params = { 
        customerName: 'Juan', 
        items: [{ productName: 'Prod', quantity: 1, unit: 'kg' }] 
      };
      const result = await createOrderIntent(params, 'es', 1.0);

      expect(result.data.reason).toBe('multiple_customers');
    });

    it('should return product_not_found if product missing', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Cliente' }]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const params = {
        customerName: 'Cliente',
        items: [{ productName: 'Missing', quantity: 1, unit: 'kg' }],
      };
      
      const result = await createOrderIntent(params, 'es', 1.0);
      expect(result.data.reason).toBe('product_not_found');
    });

    it('should return price_not_found if product has no current price', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Cliente' }]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'p1', name: 'Producto 1', prices: [] }, // No prices
      ]);

      const params = {
        customerName: 'Cliente',
        items: [{ productName: 'Producto 1', quantity: 1, unit: 'kg' }],
      };
      
      const result = await createOrderIntent(params, 'es', 1.0);
      expect(result.data.reason).toBe('price_not_found');
    });
  });

  describe('confirmOrderIntent', () => {
    const mockPendingOrder = {
      customerId: 'c1',
      customerName: 'Cliente',
      items: [{ productId: 'p1', productName: 'Prod', quantity: 1, unit: 'kg', unitPrice: 10, totalPrice: 10 }],
      subtotal: 10,
      taxRate: 0.13,
      taxAmount: 1.3,
      total: 11.3,
      sendChannel: 'whatsapp',
    };

    const mockInvoice = {
      id: 'inv1',
      number: 'INV-001',
      createdAt: new Date(),
      items: [],
      subtotal: 10,
      taxAmount: 1.3,
      total: 11.3,
    };

    beforeEach(() => {
      (InvoicesService as any).mockImplementation(() => ({
        create: jest.fn().mockResolvedValue(mockInvoice),
      }));
      (generateInvoicePDF as jest.Mock).mockReturnValue(Buffer.from('pdf'));
      (WhatsAppService as any).mockImplementation(() => ({
        sendMessage: jest.fn().mockResolvedValue('sid'),
      }));
      (sendInvoiceEmail as jest.Mock).mockResolvedValue(true);
      (sendInvoiceDocument as jest.Mock).mockResolvedValue(true);
    });

    it('should confirm order and send via WhatsApp', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        phone: '1234567890',
      });

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'whatsapp' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(result.data.sentVia).toBe('whatsapp');
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ channel: 'WHATSAPP', status: 'SENT' }));
    });

    it('should confirm order and send via Email', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        email: 'test@example.com',
      });

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'email' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(result.data.sentVia).toBe('email');
      expect(sendInvoiceEmail).toHaveBeenCalled();
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ channel: 'EMAIL', status: 'SENT' }));
    });

    it('should confirm order and send via Telegram', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        telegramChatId: '12345',
      });

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'telegram' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(result.data.sentVia).toBe('telegram');
      expect(sendInvoiceDocument).toHaveBeenCalled();
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ channel: 'TELEGRAM', status: 'SENT' }));
    });

    it('should handle missing contact info for Email', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        // No email
      });

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'email' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(result.data.sentVia).toBe('none');
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', error: 'Customer has no email address' }));
    });

    it('should handle missing phone number for WhatsApp', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        // No phone
      });

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'whatsapp' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(result.data.sentVia).toBe('none');
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', error: 'Customer has no phone number' }));
    });

    it('should handle missing chat ID for Telegram', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        // No telegramChatId
      });

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'telegram' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(result.data.sentVia).toBe('none');
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', error: 'Customer has no telegram chat ID' }));
    });

    it('should log error if Email notification fails', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        email: 'test@example.com',
      });
      
      (sendInvoiceEmail as jest.Mock).mockRejectedValue(new Error('Email Fail'));

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'email' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', error: 'Email Fail' }));
    });

    it('should log error if Telegram notification fails', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        telegramChatId: '123',
      });
      
      (sendInvoiceDocument as jest.Mock).mockRejectedValue(new Error('Telegram Fail'));

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'telegram' } };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(true);
      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', error: 'Telegram Fail' }));
    });

    it('should handle global error in confirmOrderIntent', async () => {
      (prisma.customer.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const context = { pendingOrder: mockPendingOrder };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(result.data.success).toBe(false);
      expect(result.data.reason).toBe('internal_error');
    });

    it('should handle missing pending order', async () => {
      const result = await confirmOrderIntent({}, 'es', 1.0, {});
      expect(result.data.reason).toBe('no_pending_order');
    });

    it('should handle customer not found', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
      const context = { pendingOrder: mockPendingOrder };
      const result = await confirmOrderIntent({}, 'es', 1.0, context as any);
      expect(result.data.reason).toBe('customer_not_found');
    });

    it('should log error if notification fails', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        name: 'Cliente',
        phone: '1234567890',
      });
      
      (WhatsAppService as any).mockImplementation(() => ({
        sendMessage: jest.fn().mockRejectedValue(new Error('Fail')),
      }));

      const context = { pendingOrder: { ...mockPendingOrder, sendChannel: 'whatsapp' } };
      await confirmOrderIntent({}, 'es', 1.0, context as any);

      expect(createNotificationLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }));
    });
  });

  describe('cancelOrderIntent', () => {
    // Import cancelOrderIntent at top or use require
    it('should return cancel_order success', async () => {
       // Since I didn't import it in the top import statement in previous tool call, I need to check if I can add it now.
       // Ah, I did import it: import { ..., cancelOrderIntent } from ...
       // Let's verify imports in file.
       // Yes, I did: import { extractOrderParams, createOrderIntent, confirmOrderIntent } ... wait, I missed cancelOrderIntent in the import list in previous WRITE call?
       // Let's check the file content first.
       const { cancelOrderIntent } = require('@/lib/services/chat/intents/create-order');
       const result = await cancelOrderIntent({}, 'es', 1.0);
       expect(result.intent).toBe('cancel_order');
       expect(result.data.success).toBe(true);
    });
  });
});
