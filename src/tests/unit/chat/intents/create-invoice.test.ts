
import { 
  createInvoiceIntent, 
  confirmInvoiceIntent,
  cancelInvoiceIntent
} from '@/lib/services/chat/intents/create-invoice';
import prisma from '@/lib/db';
import { InvoicesService } from '@/lib/services/invoices.service';

// Mocks
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    customer: { findMany: jest.fn(), findUnique: jest.fn() },
    product: { findMany: jest.fn() },
    invoice: { create: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('@/lib/services/invoices.service');

// Global fetch mock for OpenAI
global.fetch = jest.fn();

describe('Create Invoice Intent', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createInvoiceIntent', () => {
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

    it('should create a pending invoice successfully', async () => {
      // 1. Mock OpenAI response
      (global.fetch as jest.Mock).mockResolvedValue(
        mockOpenAIResponse({
          customer_name: 'Supermercado El Sol',
          items: [{ product_name: 'Tomate', quantity: 50, unit_price: 1.5 }],
          notes: 'Entrega urgente',
        })
      );

      // 2. Mock Prisma responses
      // Customer lookup
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([
        { id: 'cust-1', name: 'Supermercado El Sol', taxId: '123' },
      ]);

      // Product lookup
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { 
          id: 'prod-1', 
          name: 'Tomate Larga Vida', 
          prices: [{ 
            isCurrent: true,
            sellPrice: { toNumber: () => 1.5 },
            costPrice: { toNumber: () => 1.0 }
          }] 
        },
      ]);

      const result = await createInvoiceIntent(
        { message: 'Crear factura para Supermercado El Sol: 50kg de Tomate' },
        'es',
        0.9
      );

      expect(result.data.type).toBe('create_invoice');
      expect(result.data.created).toBe(false); // pending confirmation
      expect(result.data.reason).toBe('confirmation_required');
      
      const pending = result.data.pendingInvoice;
      expect(pending).toBeDefined();
      expect(pending.customerName).toBe('Supermercado El Sol');
      expect(pending.items).toHaveLength(1);
      expect(pending.items[0].productName).toBe('Tomate Larga Vida');
      expect(pending.items[0].quantity).toBe(50);
      expect(pending.subtotal).toBe(75); // 50 * 1.5
    });

    it('should return error if customer not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockOpenAIResponse({
          customer_name: 'Unknown Customer',
          items: [{ product_name: 'Tomate', quantity: 50 }],
        })
      );

      (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);

      const result = await createInvoiceIntent(
        { message: 'Factura para Unknown' },
        'es',
        0.9
      );

      expect(result.data.type).toBe('create_invoice');
      expect(result.data.reason).toBe('customer_not_found');
    });
  });

  describe('confirmInvoiceIntent', () => {
    it('should call InvoicesService.create when confirmed', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'inv-123',
        number: 'INV-2024-0001',
        total: { toNumber: () => 100 },
      });
      (InvoicesService as jest.Mock).mockImplementation(() => ({
        create: mockCreate,
      }));

      const pendingInvoice = {
        customerId: 'cust-1',
        customerName: 'Test Customer',
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 10,
            unitPrice: 10,
            description: 'Test Product',
            totalPrice: 100,
          },
        ],
        subtotal: 100,
        taxRate: 0.13,
        taxAmount: 13,
        total: 113,
        dueDate: new Date().toISOString(),
        notes: 'Test note',
      };

      const context = {
        userId: 'user-1',
        pendingInvoice,
      };

      const result = await confirmInvoiceIntent(
        { message: 'confirmar' },
        'es',
        1.0,
        context
      );

      expect(result.data.type).toBe('confirm_invoice');
      expect(result.data.success).toBe(true);
      expect(result.data.invoice.number).toBe('INV-2024-0001');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 'prod-1',
              quantity: 10,
            }),
          ]),
        }),
        'user-1'
      );
    });

    it('should fail if no pending invoice in context', async () => {
      const result = await confirmInvoiceIntent(
        { message: 'confirmar' },
        'es',
        1.0,
        {} // empty context
      );

      expect(result.data.success).toBe(false);
      expect(result.data.reason).toBe('no_pending_invoice');
    });
  });

  describe('cancelInvoiceIntent', () => {
    it('should return success', async () => {
      const result = await cancelInvoiceIntent({}, 'es', 1.0);
      expect(result.data.success).toBe(true);
    });
  });
});
