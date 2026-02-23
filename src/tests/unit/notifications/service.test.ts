import { NotificationsService } from '@/lib/services/notifications/service';
import prisma from '@/lib/db';

jest.mock('@/lib/db', () => ({
  auditLog: {
    create: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  notification: {
    createMany: jest.fn(),
  },
}));

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs success notification for email channel', async () => {
    const payload = {
      trigger: 'status_change' as const,
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      previousStatus: 'PENDING',
      newStatus: 'PAID',
    };

    // Mock finding users for the customer
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'user-1', customerId: 'cust-1' },
      { id: 'user-2', customerId: 'cust-1' }
    ]);

    await NotificationsService.sendNotification(payload, ['email'], {
      maxRetries: 1,
    });

    // Check AuditLog creation
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'NOTIFICATION_SENT',
          entityType: 'notification',
        }),
      }),
    );

    // Check Notification creation
    expect(prisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            type: 'INFO',
            title: 'Estado de Factura Actualizado',
          }),
          expect.objectContaining({
            userId: 'user-2',
            type: 'INFO',
            title: 'Estado de Factura Actualizado',
          })
        ]),
      }),
    );
  });
});

