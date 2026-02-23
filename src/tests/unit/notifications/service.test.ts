import { NotificationsService } from '@/lib/services/notifications/service';
import prisma from '@/lib/db';

jest.mock('@/lib/db', () => ({
  auditLog: {
    create: jest.fn(),
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

    await NotificationsService.sendNotification(payload, ['email'], {
      maxRetries: 1,
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'NOTIFICATION_SENT',
          entityType: 'notification',
        }),
      }),
    );
  });
});

