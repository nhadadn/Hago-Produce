import { ProductPriceService } from '@/lib/services/product-prices/product-prices.service';
import prisma from '@/lib/db';
import { ProductPriceInput } from '@/lib/validation/product-price';

// Mock DB
jest.mock('@/lib/db', () => {
  const mockPrisma = {
    productPrice: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      return Promise.resolve(arg);
    }),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('ProductPriceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated prices', async () => {
      const mockPrices = [{ id: '1', costPrice: 10 }];
      const mockCount = 1;
      (prisma.productPrice.findMany as jest.Mock).mockResolvedValue(mockPrices);
      (prisma.productPrice.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await ProductPriceService.getAll({ page: 1, limit: 10 });

      expect(result.prices).toEqual(mockPrices);
      expect(result.meta.total).toBe(mockCount);
      expect(prisma.productPrice.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
    });

    it('should filter by isCurrent', async () => {
      (prisma.productPrice.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.productPrice.count as jest.Mock).mockResolvedValue(0);

      await ProductPriceService.getAll({ isCurrent: true });

      expect(prisma.productPrice.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isCurrent: true }),
      }));
    });
  });

  describe('create', () => {
    it('should mark previous current prices as non-current if new price is current', async () => {
      const input: ProductPriceInput = {
        productId: 'p1',
        supplierId: 's1',
        costPrice: 10,
        currency: 'USD',
        isCurrent: true,
        effectiveDate: new Date(),
        source: 'manual',
      };

      (prisma.productPrice.create as jest.Mock).mockResolvedValue({ id: 'new', ...input });

      await ProductPriceService.create(input);

      expect(prisma.productPrice.updateMany).toHaveBeenCalledWith({
        where: {
          productId: input.productId,
          supplierId: input.supplierId,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });
      expect(prisma.productPrice.create).toHaveBeenCalledWith({ data: input });
    });

    it('should not mark previous prices if new price is not current', async () => {
      const input: ProductPriceInput = {
        productId: 'p1',
        supplierId: 's1',
        costPrice: 10,
        currency: 'USD',
        isCurrent: false,
        effectiveDate: new Date(),
        source: 'manual',
      };

      (prisma.productPrice.create as jest.Mock).mockResolvedValue({ id: 'new', ...input });

      await ProductPriceService.create(input);

      expect(prisma.productPrice.updateMany).not.toHaveBeenCalled();
      expect(prisma.productPrice.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('bulkUpdateFromMake', () => {
    it('should process valid items', async () => {
      const payload = {
        source: 'make',
        prices: [
          {
            product_name: 'Product A',
            supplier_name: 'Supplier A',
            cost_price: 100,
            currency: 'USD',
          },
        ],
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'p1' });
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 's1' });
      (prisma.productPrice.create as jest.Mock).mockResolvedValue({ id: 'price1' });

      const result = await ProductPriceService.bulkUpdateFromMake(payload);

      expect(result.processed).toBe(1);
      expect(result.created).toBe(1);
      expect(result.errors).toBe(0);
      expect(prisma.productPrice.create).toHaveBeenCalled();
    });

    it('should create supplier if not found', async () => {
      const payload = {
        source: 'make',
        prices: [
          {
            product_name: 'Product A',
            supplier_name: 'New Supplier',
            cost_price: 100,
          },
        ],
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'p1' });
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.create as jest.Mock).mockResolvedValue({ id: 's_new', name: 'New Supplier' });

      await ProductPriceService.bulkUpdateFromMake(payload);

      expect(prisma.supplier.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ name: 'New Supplier' }),
      }));
      expect(prisma.productPrice.create).toHaveBeenCalled();
    });

    it('should report error if product not found', async () => {
      const payload = {
        source: 'make',
        prices: [
          {
            product_name: 'Unknown Product',
            supplier_name: 'Supplier A',
            cost_price: 100,
          },
        ],
      };

      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await ProductPriceService.bulkUpdateFromMake(payload);

      expect(result.processed).toBe(1); // Processed but with error? Logic says processed++ anyway
      expect(result.created).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details[0].message).toBe('Product not found');
    });
  });
});
