import { NotificationTriggers } from '@/lib/services/notifications/triggers';
import prisma from '@/lib/db';

jest.mock('@/lib/services/notifications/twilio', () => ({
  sendWhatsAppMessage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/services/notifications/service', () => ({
  NotificationsService: {
    triggerStatusChange: jest.fn(),
  },
}));

jest.mock('@/lib/services/bot/whatsapp.service', () => ({
  whatsAppService: { formatWhatsAppNumber: (n: string) => '+1' + n.replace(/\D/g, '').slice(-10) },
}));

jest.mock('@/lib/db', () => ({
  invoice: {
    findUnique: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));

describe('NotificationTriggers.handleInvoiceStatusChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends WhatsApp and logs to AuditLog when phone is present and no recent logs', async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      number: 'INV-001',
      total: 123.45,
      customerId: 'cust-1',
      customer: { name: 'Cliente', phone: '5555555555', email: 'c@x.com' },
    });
    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

    await NotificationTriggers.handleInvoiceStatusChange('inv-1', 'PENDING' as any, 'PAID' as any);

    expect(prisma.auditLog.create as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'NOTIFICATION_SENT',
          entityType: 'notification',
          entityId: 'inv-1',
        }),
      }),
    );
  });
});

