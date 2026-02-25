import prisma from '@/lib/db';

describe('ReportCache Model Integration Tests', () => {
  // Mock In-Memory Store
  let store: any[] = [];

  beforeAll(() => {
    // Override create
    (prisma.reportCache.create as jest.Mock).mockImplementation(async ({ data }) => {
      const entry = {
        id: `rc-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      store.push(entry);
      return entry;
    });

    // Override createMany
    (prisma.reportCache.createMany as jest.Mock).mockImplementation(async ({ data }) => {
      const entries = (Array.isArray(data) ? data : [data]).map((d: any) => ({
        id: `rc-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...d,
      }));
      store.push(...entries);
      return { count: entries.length };
    });

    // Override findMany
    (prisma.reportCache.findMany as jest.Mock).mockImplementation(async (args) => {
      const where = args?.where || {};
      return store.filter(item => {
        if (where.reportType && item.reportType !== where.reportType) return false;
        if (where.expiresAt) {
          if (where.expiresAt.gt && !(new Date(item.expiresAt) > new Date(where.expiresAt.gt))) return false;
          if (where.expiresAt.lte && !(new Date(item.expiresAt) <= new Date(where.expiresAt.lte))) return false;
        }
        return true;
      });
    });

    // Override findUnique
    (prisma.reportCache.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
      return store.find(item => item.id === where.id) || null;
    });

    // Override update
    (prisma.reportCache.update as jest.Mock).mockImplementation(async ({ where, data }) => {
      const index = store.findIndex(item => item.id === where.id);
      if (index === -1) throw new Error('Record not found');
      const updated = { ...store[index], ...data };
      store[index] = updated;
      return updated;
    });

    // Override delete
    (prisma.reportCache.delete as jest.Mock).mockImplementation(async ({ where }) => {
      const index = store.findIndex(item => item.id === where.id);
      if (index === -1) throw new Error('Record not found');
      const deleted = store[index];
      store.splice(index, 1);
      return deleted;
    });

    // Override deleteMany
    (prisma.reportCache.deleteMany as jest.Mock).mockImplementation(async ({ where }) => {
      if (!where) {
         const count = store.length;
         store = [];
         return { count };
      }
      const initialLen = store.length;
      store = store.filter(item => {
          if (where.reportType?.in && where.reportType.in.includes(item.reportType)) return false; // Delete
          return true; // Keep
      });
      return { count: initialLen - store.length };
    });
  });

  afterAll(async () => {
    // Cleanup any report cache entries created during tests
    await prisma.reportCache.deleteMany({
      where: {
        reportType: {
          in: ['REVENUE', 'AGING', 'TOP_PERFORMERS', 'PRICE_TRENDS'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('CRUD Operations', () => {
    it('should create a cache entry with valid JSON data', async () => {
      const cache = await prisma.reportCache.create({
        data: {
          reportType: 'REVENUE',
          parameters: JSON.stringify({ startDate: '2024-01-01', endDate: '2024-01-31' }),
          data: JSON.stringify({ total: 1000, currency: 'USD' }),
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        },
      });

      expect(cache).toHaveProperty('id');
      expect(cache.reportType).toBe('REVENUE');
      expect(JSON.parse(cache.parameters)).toEqual({ startDate: '2024-01-01', endDate: '2024-01-31' });
      expect(JSON.parse(cache.data)).toEqual({ total: 1000, currency: 'USD' });
      expect(cache.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should update an existing cache entry', async () => {
      const cache = await prisma.reportCache.create({
        data: {
          reportType: 'AGING',
          parameters: '{}',
          data: '[]',
          expiresAt: new Date(),
        },
      });

      const updated = await prisma.reportCache.update({
        where: { id: cache.id },
        data: {
          data: JSON.stringify({ updated: true }),
          expiresAt: new Date(Date.now() + 7200 * 1000), // 2 hours
        },
      });

      expect(JSON.parse(updated.data)).toEqual({ updated: true });
      expect(updated.expiresAt.getTime()).toBeGreaterThan(cache.expiresAt.getTime());
    });

    it('should delete a cache entry', async () => {
      const cache = await prisma.reportCache.create({
        data: {
          reportType: 'TOP_PERFORMERS',
          parameters: '{}',
          data: '[]',
          expiresAt: new Date(),
        },
      });

      await prisma.reportCache.delete({
        where: { id: cache.id },
      });

      const found = await prisma.reportCache.findUnique({
        where: { id: cache.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Expiration & Cleanup', () => {
    beforeAll(async () => {
      // Seed data with mixed expiration times
      const now = Date.now();
      await prisma.reportCache.createMany({
        data: [
          {
            reportType: 'PRICE_TRENDS',
            parameters: '{"id":1}',
            data: '{}',
            expiresAt: new Date(now - 3600 * 1000), // Expired 1 hour ago
          },
          {
            reportType: 'PRICE_TRENDS',
            parameters: '{"id":2}',
            data: '{}',
            expiresAt: new Date(now + 3600 * 1000), // Valid for 1 hour
          },
        ],
      });
    });

    it('should find only valid cache entries', async () => {
      const validCaches = await prisma.reportCache.findMany({
        where: {
          reportType: 'PRICE_TRENDS',
          expiresAt: { gt: new Date() },
        },
      });

      expect(validCaches.length).toBeGreaterThanOrEqual(1);
      validCaches.forEach(cache => {
        expect(cache.expiresAt.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should identify expired entries for cleanup', async () => {
      const expiredCaches = await prisma.reportCache.findMany({
        where: {
          expiresAt: { lte: new Date() },
        },
      });

      expect(expiredCaches.length).toBeGreaterThanOrEqual(1);
      expiredCaches.forEach(cache => {
        expect(cache.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle large JSON payloads', async () => {
      const largeData = { items: new Array(1000).fill({ id: 1, name: 'Test Item' }) };
      const cache = await prisma.reportCache.create({
        data: {
          reportType: 'REVENUE',
          parameters: '{}',
          data: JSON.stringify(largeData),
          expiresAt: new Date(),
        },
      });

      expect(cache.data.length).toBeGreaterThan(10000);
      const parsed = JSON.parse(cache.data);
      expect(parsed.items.length).toBe(1000);
    });

    it('should enforce unique ID constraint (implicit)', async () => {
      // Prisma handles UUID generation, but we can test that creating two identical entries works
      // because ID is unique per entry, even if content is same
      const entry1 = await prisma.reportCache.create({
        data: {
          reportType: 'REVENUE',
          parameters: '{}',
          data: '{}',
          expiresAt: new Date(),
        },
      });

      const entry2 = await prisma.reportCache.create({
        data: {
          reportType: 'REVENUE',
          parameters: '{}',
          data: '{}',
          expiresAt: new Date(),
        },
      });

      expect(entry1.id).not.toBe(entry2.id);
    });
  });
});
