import { supplierService } from '@/lib/services/suppliers.service';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    supplier: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

describe('SupplierService', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create a supplier with default isActive=true', async () => {
      const mockSupplier = {
        id: '1',
        name: 'Supplier A',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.supplier.create.mockResolvedValue(mockSupplier);

      const result = await supplierService.createSupplier({ name: 'Supplier A' });

      expect(mockPrisma.supplier.create).toHaveBeenCalledWith({
        data: { name: 'Supplier A', isActive: true },
      });
      expect(result).toEqual(mockSupplier);
    });

    it('should create a supplier with explicit isActive=false', async () => {
      const mockSupplier = {
        id: '1',
        name: 'Supplier B',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.supplier.create.mockResolvedValue(mockSupplier);

      const result = await supplierService.createSupplier({ name: 'Supplier B', isActive: false });

      expect(mockPrisma.supplier.create).toHaveBeenCalledWith({
        data: { name: 'Supplier B', isActive: false },
      });
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('getSupplierById', () => {
    it('should return a supplier by id', async () => {
      const mockSupplier = { id: '1', name: 'Supplier A' };
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);

      const result = await supplierService.getSupplierById('1');

      expect(mockPrisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockSupplier);
    });

    it('should return null if not found', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);
      const result = await supplierService.getSupplierById('999');
      expect(result).toBeNull();
    });
  });

  describe('getSupplierByName', () => {
    it('should return a supplier by name', async () => {
      const mockSupplier = { id: '1', name: 'Supplier A' };
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);

      const result = await supplierService.getSupplierByName('Supplier A');

      expect(mockPrisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { name: 'Supplier A' },
      });
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('updateSupplier', () => {
    it('should update a supplier', async () => {
      const mockSupplier = { id: '1', name: 'Updated Name' };
      mockPrisma.supplier.update.mockResolvedValue(mockSupplier);

      const result = await supplierService.updateSupplier('1', { name: 'Updated Name' });

      expect(mockPrisma.supplier.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Name' },
      });
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('getSuppliers', () => {
    it('should return paginated suppliers with default params', async () => {
      const mockSuppliers = [{ id: '1', name: 'Supplier A' }];
      mockPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);
      mockPrisma.supplier.count.mockResolvedValue(1);

      const result = await supplierService.getSuppliers({});

      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }));
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([]);
      mockPrisma.supplier.count.mockResolvedValue(0);

      await supplierService.getSuppliers({ search: 'test' });

      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'test', mode: 'insensitive' } },
            { contactName: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
          ]),
        }),
      }));
    });

    it('should filter by isActive (true)', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([]);
      mockPrisma.supplier.count.mockResolvedValue(0);

      await supplierService.getSuppliers({ isActive: true });

      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
        }),
      }));
    });

    it('should filter by isActive (false)', async () => {
        mockPrisma.supplier.findMany.mockResolvedValue([]);
        mockPrisma.supplier.count.mockResolvedValue(0);
  
        await supplierService.getSuppliers({ isActive: false });
  
        expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        }));
      });
  });
});
