import { NotificationTriggers } from '@/lib/services/notifications/triggers';
import prisma from '@/lib/db';
import { NotificationsService } from '@/lib/services/notifications/service';
import { InvoiceStatus } from '@prisma/client';

jest.mock('@/lib/db', () => ({
  invoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
}));

jest.mock('@/lib/services/notifications/service', () => ({
  NotificationsService: {
    triggerStatusChange: jest.fn(),
    triggerDueDate: jest.fn(),
    triggerOverdue: jest.fn(),
  },
}));

describe('NotificationTriggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handleInvoiceStatusChange triggers notification when invoice exists', async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      customerId: 'cust-1',
    });

    await NotificationTriggers.handleInvoiceStatusChange(
      'inv-1',
      InvoiceStatus.PENDING,
      InvoiceStatus.PAID,
    );

    expect(NotificationsService.triggerStatusChange).toHaveBeenCalledWith(
      'inv-1',
      'cust-1',
      InvoiceStatus.PENDING,
      InvoiceStatus.PAID,
    );
  });

  it('handleDueDateNotification triggers for pending invoices due today', async () => {
    const today = new Date();
    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'inv-1',
        customerId: 'cust-1',
        dueDate: today,
      },
    ]);

    await NotificationTriggers.handleDueDateNotification();

    expect(NotificationsService.triggerDueDate).toHaveBeenCalled();
  });

  it('handleOverdueNotification triggers for overdue invoices', async () => {
    const pastDate = new Date();
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
      expect.any(String),
      expect.any(Number),
    );
  });
});

