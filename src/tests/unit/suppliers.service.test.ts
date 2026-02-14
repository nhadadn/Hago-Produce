import { supplierService } from '@/lib/services/suppliers.service';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  supplier: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe('SupplierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create a supplier', async () => {
      const mockSupplier = {
        id: '1',
        name: 'Supplier A',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.create as jest.Mock).mockResolvedValue(mockSupplier);

      const result = await supplierService.createSupplier({ name: 'Supplier A' });

      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: { name: 'Supplier A', isActive: true },
      });
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('getSuppliers', () => {
    it('should return paginated suppliers', async () => {
      const mockSuppliers = [{ id: '1', name: 'Supplier A' }];
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);
      (prisma.supplier.count as jest.Mock).mockResolvedValue(1);

      const result = await supplierService.getSuppliers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.supplier.count as jest.Mock).mockResolvedValue(0);

      await supplierService.getSuppliers({ search: 'test' });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'test', mode: 'insensitive' } },
          ]),
        }),
      }));
    });
  });
});
