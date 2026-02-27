import { NotificationsService } from '@/lib/services/notifications/service';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';

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

jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/services/telegram.service', () => ({
  getCustomerChatId: jest.fn(),
  sendNotification: jest.fn(),
}));

import { getCustomerChatId, sendNotification as sendTelegramNotification } from '@/lib/services/telegram.service';

describe('NotificationsService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const basePayload = {
    trigger: 'status_change' as const,
    invoiceId: 'inv-1',
    customerId: 'cust-1',
    previousStatus: 'PENDING',
    newStatus: 'PAID',
  };

  it('logs success notification for email channel', async () => {
    // Mock finding users for the customer
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'user-1', customerId: 'cust-1' },
      { id: 'user-2', customerId: 'cust-1' }
    ]);

    await NotificationsService.sendNotification(basePayload, ['email'], {
      maxRetries: 1,
    });

    // Check AuditLog creation
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'NOTIFICATION_SENT',
          entityType: 'notification',
          changes: expect.objectContaining({
            channel: 'email',
            status: 'success',
          }),
        }),
      }),
    );

    // Check Notification creation
    expect(prisma.notification.createMany).toHaveBeenCalled();
  });

  it('sends via webhook when NOTIFICATIONS_WEBHOOK_URL is set', async () => {
    process.env.NOTIFICATIONS_WEBHOOK_URL = 'https://webhook.example.com';
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await NotificationsService.sendNotification(basePayload, ['webhook'], { maxRetries: 1 });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://webhook.example.com',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(basePayload),
      })
    );
    
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changes: expect.objectContaining({
            channel: 'webhook',
            status: 'success',
          }),
        }),
      })
    );
  });

  it('skips webhook when NOTIFICATIONS_WEBHOOK_URL is missing', async () => {
    delete process.env.NOTIFICATIONS_WEBHOOK_URL;

    await NotificationsService.sendNotification(basePayload, ['webhook'], { maxRetries: 1 });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      '[NOTIFICATION_WEBHOOK_SKIPPED]',
      expect.anything()
    );
  });

  it('sends via telegram when chat ID exists', async () => {
    (getCustomerChatId as jest.Mock).mockResolvedValue('12345');
    (sendTelegramNotification as jest.Mock).mockResolvedValue({ success: true });

    await NotificationsService.sendNotification(basePayload, ['telegram'], { maxRetries: 1 });

    expect(getCustomerChatId).toHaveBeenCalledWith('cust-1');
    expect(sendTelegramNotification).toHaveBeenCalledWith('12345', expect.stringContaining('La factura ha cambiado de estado'));
    
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changes: expect.objectContaining({
            channel: 'telegram',
            status: 'success',
          }),
        }),
      })
    );
  });

  it('retries on failure up to maxRetries', async () => {
    process.env.NOTIFICATIONS_WEBHOOK_URL = 'https://webhook.example.com';
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true });

    await NotificationsService.sendNotification(basePayload, ['webhook'], { maxRetries: 2 });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changes: expect.objectContaining({
            channel: 'webhook',
            status: 'success',
            attempts: 2,
          }),
        }),
      })
    );
  });

  it('logs failure after max retries exhausted', async () => {
    process.env.NOTIFICATIONS_WEBHOOK_URL = 'https://webhook.example.com';
    const error = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValue(error);

    await expect(NotificationsService.sendNotification(basePayload, ['webhook'], { maxRetries: 2 }))
      .rejects.toThrow('Network error');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'NOTIFICATION_SENT',
          changes: expect.objectContaining({
            channel: 'webhook',
            status: 'failed',
            attempts: 2,
            errorMessage: 'Network error',
          }),
        }),
      })
    );
  });

  it('skips telegram when no chat ID found', async () => {
    (getCustomerChatId as jest.Mock).mockResolvedValue(null);

    await NotificationsService.sendNotification(basePayload, ['telegram']);

    expect(getCustomerChatId).toHaveBeenCalledWith('cust-1');
    expect(sendTelegramNotification).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('throws error when telegram send fails', async () => {
    (getCustomerChatId as jest.Mock).mockResolvedValue('12345');
    (sendTelegramNotification as jest.Mock).mockResolvedValue({ success: false, error: 'Telegram API Error' });

    await expect(NotificationsService.sendNotification(basePayload, ['telegram'], { maxRetries: 1 }))
      .rejects.toThrow('Telegram API Error');

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changes: expect.objectContaining({
            channel: 'telegram',
            status: 'failed',
            errorMessage: 'Telegram API Error',
          }),
        }),
      })
    );
  });

  it('handles trigger helper methods', async () => {
    const spy = jest.spyOn(NotificationsService, 'sendNotification').mockImplementation();

    await NotificationsService.triggerStatusChange('inv-1', 'cust-1', 'PENDING', 'PAID');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      trigger: 'status_change',
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      previousStatus: 'PENDING',
      newStatus: 'PAID',
    }));

    await NotificationsService.triggerDueDate('inv-1', 'cust-1', '2024-01-01');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      trigger: 'due_date',
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      dueDate: '2024-01-01',
    }));

    await NotificationsService.triggerOverdue('inv-1', 'cust-1', '2024-01-01', 5);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      trigger: 'overdue',
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      dueDate: '2024-01-01',
      daysOverdue: 5,
    }));
    
    spy.mockRestore();
  });

  it('persists notification for due_date trigger', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }]);
    
    const payload = { ...basePayload, trigger: 'due_date' as const, dueDate: '2024-01-01' };
    await NotificationsService.sendNotification(payload, ['email'], { maxRetries: 1 });

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          type: 'WARNING',
          title: 'Factura por Vencer',
        })
      ])
    });
  });

  it('persists notification for overdue trigger', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }]);
    
    const payload = { ...basePayload, trigger: 'overdue' as const, dueDate: '2024-01-01', daysOverdue: 1 };
    await NotificationsService.sendNotification(payload, ['email'], { maxRetries: 1 });

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          type: 'ERROR',
          title: 'Factura Vencida',
        })
      ])
    });
  });
  
  it('handles DB error during notification persistence gracefully', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }]);
    (prisma.notification.createMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // Should NOT throw
    await NotificationsService.sendNotification(basePayload, ['email'], { maxRetries: 1 });

    expect(logger.error).toHaveBeenCalledWith('Failed to persist notification to DB:', expect.any(Error));
  });

  it('uses default content for unknown trigger', async () => {
    const payload = { ...basePayload, trigger: 'unknown_trigger' as any };
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }]);

    await NotificationsService.sendNotification(payload, ['email'], { maxRetries: 1 });

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          title: 'Notificación del Sistema',
          message: 'Tiene una nueva notificación.',
          type: 'INFO',
        })
      ])
    });
  });
});
