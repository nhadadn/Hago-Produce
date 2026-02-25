import { NotificationTriggers } from '@/lib/services/notifications/triggers';
import prisma from '@/lib/db';
import { NotificationsService } from '@/lib/services/notifications/service';
import { sendWhatsAppMessage } from '@/lib/services/notifications/twilio';
import { whatsAppService } from '@/lib/services/bot/whatsapp.service';
import { InvoiceStatus } from '@prisma/client';

jest.mock('@/lib/db', () => ({
  invoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/lib/services/notifications/service', () => ({
  NotificationsService: {
    triggerStatusChange: jest.fn(),
    triggerDueDate: jest.fn(),
    triggerOverdue: jest.fn(),
  },
}));

jest.mock('@/lib/services/notifications/twilio', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

jest.mock('@/lib/services/bot/whatsapp.service', () => ({
  whatsAppService: {
    formatWhatsAppNumber: jest.fn((phone) => phone),
  },
}));

describe('NotificationTriggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleInvoiceStatusChange', () => {
    const mockInvoice = {
      id: 'inv-1',
      number: 'INV-001',
      total: 100,
      customerId: 'cust-1',
      customer: {
        name: 'Test Customer',
        phone: '+1234567890',
        email: 'test@example.com',
      },
    };

    it('sends WhatsApp and skips standard notification if customer has phone and no recent logs', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]); // No recent logs
      (sendWhatsAppMessage as jest.Mock).mockResolvedValue(true);

      await NotificationTriggers.handleInvoiceStatusChange(
        'inv-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );

      expect(sendWhatsAppMessage).toHaveBeenCalledWith(
        'whatsapp:+1234567890',
        expect.stringContaining('tu factura INV-001 ha cambiado a estado PAID')
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          action: 'NOTIFICATION_SENT',
          changes: expect.objectContaining({ channel: 'whatsapp' }),
        })
      }));
      // Standard notification should be skipped
      expect(NotificationsService.triggerStatusChange).not.toHaveBeenCalled();
    });

    it('handles missing customer name gracefully', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        ...mockInvoice,
        customer: { ...mockInvoice.customer, name: null },
      });
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (sendWhatsAppMessage as jest.Mock).mockResolvedValue(true);

      await NotificationTriggers.handleInvoiceStatusChange(
        'inv-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );

      expect(sendWhatsAppMessage).toHaveBeenCalledWith(
        'whatsapp:+1234567890',
        expect.stringContaining('Hola , tu factura')
      );
    });

    it('falls back to standard notification if WhatsApp fails', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (sendWhatsAppMessage as jest.Mock).mockRejectedValue(new Error('WhatsApp Error'));

      await NotificationTriggers.handleInvoiceStatusChange(
        'inv-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );

      expect(NotificationsService.triggerStatusChange).toHaveBeenCalledWith(
        'inv-1',
        'cust-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );
    });

    it('uses standard notification if recent logs exist', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([{ id: 'log-1' }]); // Recent log exists

      await NotificationTriggers.handleInvoiceStatusChange(
        'inv-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );

      expect(sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(NotificationsService.triggerStatusChange).toHaveBeenCalledWith(
        'inv-1',
        'cust-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );
    });

    it('uses standard notification if customer has no phone', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        ...mockInvoice,
        customer: { ...mockInvoice.customer, phone: null },
      });
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

      await NotificationTriggers.handleInvoiceStatusChange(
        'inv-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );

      expect(sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(NotificationsService.triggerStatusChange).toHaveBeenCalledWith(
        'inv-1',
        'cust-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );
    });

    it('does nothing if invoice not found', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      await NotificationTriggers.handleInvoiceStatusChange(
        'inv-1',
        InvoiceStatus.PENDING,
        InvoiceStatus.PAID
      );

      expect(sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(NotificationsService.triggerStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('handleDueDateNotification', () => {
    it('triggers for pending invoices due today', async () => {
      const today = new Date();
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inv-1',
          customerId: 'cust-1',
          dueDate: today,
        },
      ]);

      await NotificationTriggers.handleDueDateNotification();

      expect(NotificationsService.triggerDueDate).toHaveBeenCalledWith(
        'inv-1',
        'cust-1',
        today.toISOString()
      );
    });
  });

  describe('handleOverdueNotification', () => {
    it('triggers for overdue invoices', async () => {
      const today = new Date();
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const pastDate = new Date(todayDateOnly);
      pastDate.setDate(pastDate.getDate() - 3);

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inv-1',
          customerId: 'cust-1',
          dueDate: pastDate,
        },
      ]);

      await NotificationTriggers.handleOverdueNotification();

      expect(NotificationsService.triggerOverdue).toHaveBeenCalledWith(
        'inv-1',
        'cust-1',
        pastDate.toISOString(),
        3 // 3 days overdue
      );
    });
  });
});
