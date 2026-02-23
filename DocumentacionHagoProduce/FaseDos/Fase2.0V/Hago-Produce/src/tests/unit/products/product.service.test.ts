import { ProductService } from '@/lib/services/productService';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  product: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [{ id: '1', name: 'Product A' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await ProductService.getAll({ page: 1, limit: 10 });

      expect(result.products).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
    });

    it('should filter by search', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await ProductService.getAll({ search: 'apple', page: 1, limit: 10 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'apple', mode: 'insensitive' } },
            { nameEs: { contains: 'apple', mode: 'insensitive' } },
            { sku: { contains: 'apple', mode: 'insensitive' } },
          ]),
        }),
      }));
    });

    it('should filter by category', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await ProductService.getAll({ category: 'fruits', page: 1, limit: 10 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          category: { equals: 'fruits', mode: 'insensitive' },
        }),
      }));
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const mockProduct = { id: '1', name: 'New Product' };
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const input = { name: 'New Product', unit: 'kg' };
      const result = await ProductService.create(input);

      expect(prisma.product.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const mockProduct = { id: '1', name: 'Updated Product' };
      (prisma.product.update as jest.Mock).mockResolvedValue(mockProduct);

      const input = { name: 'Updated Product' };
      const result = await ProductService.update('1', input);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: input,
      });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      const mockProduct = { id: '1', isActive: false, deletedAt: new Date() };
      (prisma.product.update as jest.Mock).mockResolvedValue(mockProduct);

      await ProductService.delete('1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: false,
          deletedAt: expect.any(Date),
        },
      });
    });
  });
});
