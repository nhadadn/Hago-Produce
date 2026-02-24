import prisma from '@/lib/db';

describe.skip('Notification Model Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test-notification-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.notification.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('CRUD Operations', () => {
    it('should create a notification with all fields', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'INFO',
          title: 'Test Notification',
          message: 'This is a test notification message',
          isRead: false,
        },
      });

      expect(notification).toHaveProperty('id');
      expect(notification.userId).toBe(testUserId);
      expect(notification.type).toBe('INFO');
      expect(notification.title).toBe('Test Notification');
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBeDefined();
    });

    it('should update isRead status', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'WARNING',
          title: 'Update Test',
          message: 'To be updated',
        },
      });

      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('should delete a notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'ERROR',
          title: 'Delete Test',
          message: 'To be deleted',
        },
      });

      await prisma.notification.delete({
        where: { id: notification.id },
      });

      const found = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('Queries & Filtering', () => {
    beforeAll(async () => {
      // Seed some notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: testUserId,
            type: 'INFO',
            title: 'Unread 1',
            message: 'Msg 1',
            isRead: false,
          },
          {
            userId: testUserId,
            type: 'INFO',
            title: 'Unread 2',
            message: 'Msg 2',
            isRead: false,
          },
          {
            userId: testUserId,
            type: 'SUCCESS',
            title: 'Read 1',
            message: 'Msg 3',
            isRead: true,
            readAt: new Date(),
          },
        ],
      });
    });

    it('should filter by userId', async () => {
      const notifications = await prisma.notification.findMany({
        where: { userId: testUserId },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter unread notifications', async () => {
      const unread = await prisma.notification.findMany({
        where: {
          userId: testUserId,
          isRead: false,
        },
      });
      // Should find at least the 2 we created + potentially others from previous tests
      const createdUnread = unread.filter(n => n.title.startsWith('Unread'));
      expect(createdUnread.length).toBe(2);
    });

    it('should order by createdAt DESC', async () => {
      const notifications = await prisma.notification.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });
      
      // Check if dates are in descending order
      for (let i = 0; i < notifications.length - 1; i++) {
        const current = new Date(notifications[i].createdAt).getTime();
        const next = new Date(notifications[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe('Validations & Constraints', () => {
    it('should fail when creating with invalid user ID', async () => {
      await expect(
        prisma.notification.create({
          data: {
            userId: 'invalid-uuid',
            type: 'INFO',
            title: 'Fail Test',
            message: 'Should fail',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce max length on title', async () => {
      const longTitle = 'a'.repeat(201); // Max is 200
      await expect(
        prisma.notification.create({
          data: {
            userId: testUserId,
            type: 'INFO',
            title: longTitle,
            message: 'Message',
          },
        })
      ).rejects.toThrow();
    });
  });
});
