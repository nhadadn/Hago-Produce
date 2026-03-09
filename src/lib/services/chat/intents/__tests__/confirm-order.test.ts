import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/services/reports/export');
jest.mock('@/lib/services/email.service');
jest.mock('@/lib/services/telegram.service');

// Import modules
import prisma from '@/lib/db';
import { confirmOrderIntent } from '../create-order';
import { InvoicesService } from '@/lib/services/invoices.service';
import { WhatsAppService } from '@/lib/services/bot/whatsapp.service';

describe('confirm-order intent', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    
    // Spy on InvoicesService prototype
    jest.spyOn(InvoicesService.prototype, 'create').mockResolvedValue({
      id: 'inv-123',
      number: 'INV-001',
      total: 100,
      items: [{
        description: 'Test Item',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100
      }],
      createdAt: new Date(),
      subtotal: 100,
      taxAmount: 0
    } as any);

    // jest.spyOn(InvoicesService.prototype, 'calculateTotal').mockReturnValue(100);
    // jest.spyOn(InvoicesService.prototype, 'generatePDF').mockResolvedValue(Buffer.from('pdf')); // generatePDF is not on prototype? it is imported?

    // Spy on WhatsApp Service prototype
    jest.spyOn(WhatsAppService.prototype, 'sendMessage').mockResolvedValue('msg-id-123');
    jest.spyOn(WhatsAppService.prototype, 'validateWebhookSignature').mockReturnValue(true);
    
    // Spy on Prisma methods
    jest.spyOn(prisma.customer, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(null);
    jest.spyOn(prisma.invoice, 'create').mockResolvedValue({ id: 'inv-123' } as any);
    jest.spyOn(prisma.notificationLog, 'create').mockResolvedValue({} as any);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
    
    jest.spyOn(prisma, '$transaction').mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return Promise.resolve([]);
    });

    // Reset WhatsApp mock implementation if needed
    // (Already mocked in factory, but can be overridden here)
  });

  it('confirms order and creates invoice', async () => {
    const pendingOrder = {
      customerId: 'cust-1',
      customerName: 'ACME',
      items: [{ productId: 'p-1', quantity: 10, unitPrice: 5, totalPrice: 50, productName: 'Prod 1' }],
      subtotal: 50,
      taxRate: 0.13,
      taxAmount: 6.5,
      total: 56.5,
      sendChannel: 'email'
    };

    (prisma.customer.findUnique as any).mockResolvedValue({
      id: 'cust-1',
      name: 'ACME',
      email: 'acme@example.com'
    } as any);
    
    // Setup invoice create mock if needed
    (prisma.invoice.create as any).mockResolvedValue({
      id: 'inv-1',
      number: 'INV-2024-0001',
    } as any);

    const result = await confirmOrderIntent({}, 'es', 1.0, { pendingOrder });

    expect(result.intent).toBe('confirm_order');
    expect(result.data?.success).toBe(true);
    expect(result.data?.sentVia).toBe('email');
    
    // Verify createNotificationLog call by checking DB
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        channel: 'EMAIL',
        recipient: 'acme@example.com',
        status: 'SENT'
      })
    }));
  });

  it('handles notification failure gracefully', async () => {
    const pendingOrder = {
      customerId: 'cust-1',
      customerName: 'ACME',
      items: [{ productId: 'p-1', quantity: 10, unitPrice: 5, totalPrice: 50, productName: 'Prod 1' }],
      subtotal: 50,
      taxRate: 0.13,
      taxAmount: 6.5,
      total: 56.5,
      sendChannel: 'whatsapp'
    };

    // Mock customer found
    (prisma.customer.findUnique as any).mockResolvedValue({
      id: 'cust-1',
      name: 'ACME',
      phone: '1234567890'
    } as any);

    // Mock WhatsApp failure
    jest.spyOn(WhatsAppService.prototype, 'sendMessage').mockRejectedValue(new Error('WhatsApp API error'));

    const result = await confirmOrderIntent({}, 'es', 1.0, { pendingOrder, userId: 'user-1' });

    expect(result.intent).toBe('confirm_order');
    expect(result.data?.success).toBe(true);
    
    // Verify createNotificationLog call by checking DB
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        channel: 'WHATSAPP',
        recipient: '1234567890',
        status: 'FAILED',
      })
    }));
  });

  it('fails if no pending order', async () => {
    const result = await confirmOrderIntent({}, 'es', 1.0, {});
    expect(result.data?.success).toBe(false);
  });
});
