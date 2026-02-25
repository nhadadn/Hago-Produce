import { createNotificationLog } from '@/lib/services/notifications/notification-log.service';
import prisma from '@/lib/db';

jest.mock('@/lib/db', () => ({
  notificationLog: {
    create: jest.fn(),
  },
}));

describe('NotificationLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates notification log successfully', async () => {
    (prisma.notificationLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });

    const result = await createNotificationLog({
      channel: 'EMAIL',
      recipient: 'test@example.com',
      status: 'SENT',
    });

    expect(result).toEqual({ id: 'log-1' });
    expect(prisma.notificationLog.create).toHaveBeenCalledWith({
      data: {
        channel: 'EMAIL',
        recipient: 'test@example.com',
        status: 'SENT',
        error: undefined,
        metadata: {},
      },
    });
  });

  it('handles error gracefully when log creation fails', async () => {
    (prisma.notificationLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await createNotificationLog({
      channel: 'EMAIL',
      recipient: 'test@example.com',
      status: 'SENT',
    });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Error creating notification log:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
