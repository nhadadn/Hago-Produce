
import { productInfoIntent } from '@/lib/services/chat/intents/product-info';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';

// Mock DB
jest.mock('@/lib/db', () => ({
  product: {
    findMany: jest.fn(),
  },
}));

// Mock Logger
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('productInfoIntent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // A) Validation Branches
  it('should handle empty params', async () => {
    const result = await productInfoIntent({}, 'es', 0.8);
    expect(result.data.items).toEqual([]);
    expect(result.data.query).toBe('');
  });

  it('should handle empty searchTerm and productName', async () => {
    const result = await productInfoIntent({ searchTerm: '', productName: '' }, 'es', 0.8);
    expect(result.data.items).toEqual([]);
    expect(result.data.query).toBe('');
  });

  it('should use productName if searchTerm is missing', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    await productInfoIntent({ productName: 'apple' }, 'es', 0.8);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it('should use searchTerm if productName is missing', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    await productInfoIntent({ searchTerm: 'apple' }, 'es', 0.8);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it('should handle special characters in input', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    await productInfoIntent({ searchTerm: '1=1; DROP TABLE' }, 'es', 0.8);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it('should handle extremely long input', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    const longTerm = 'a'.repeat(2000);
    await productInfoIntent({ searchTerm: longTerm }, 'es', 0.8);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  // C) DB Data Branches
  it('should return empty items if DB returns no products', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    const result = await productInfoIntent({ searchTerm: 'unknown' }, 'es', 0.8);
    expect(result.data.items).toEqual([]);
    expect(result.sources).toEqual([]);
  });

  it('should handle DB errors gracefully', async () => {
    const error = new Error('DB Connection Failed');
    (prisma.product.findMany as jest.Mock).mockRejectedValue(error);
    
    await expect(productInfoIntent({ searchTerm: 'apple' }, 'es', 0.8))
      .rejects.toThrow('DB Connection Failed');
  });

  // D) Business Logic Branches
  it('should return products with current prices', async () => {
    const mockProducts = [
      {
        id: 'p1',
        name: 'Apple',
        nameEs: 'Manzana',
        category: 'Fruits',
        unit: 'kg',
        sku: 'APL-001',
        prices: [
          {
            id: 'pr1',
            supplierId: 's1',
            supplier: { name: 'SupA' },
            costPrice: 10,
            sellPrice: 15,
            currency: 'USD',
            effectiveDate: new Date('2024-01-01'),
          },
        ],
      },
    ];
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const result = await productInfoIntent({ searchTerm: 'apple' }, 'es', 0.8);
    
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0].name).toBe('Apple');
    expect(result.data.items[0].nameEs).toBe('Manzana');
    expect(result.data.items[0].prices).toHaveLength(1);
    expect(result.data.items[0].prices[0].supplierName).toBe('SupA');
    expect(result.data.items[0].prices[0].costPrice).toBe(10);
    expect(result.sources).toHaveLength(1);
  });

  it('should handle null fields in product and prices', async () => {
    const mockProducts = [
      {
        id: 'p1',
        name: 'Apple',
        nameEs: null,
        category: null,
        unit: 'kg',
        sku: null,
        prices: [
          {
            id: 'pr1',
            supplierId: 's1',
            supplier: { name: 'SupA' },
            costPrice: 10,
            sellPrice: null,
            currency: 'USD',
            effectiveDate: new Date(),
          },
        ],
      },
    ];
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const result = await productInfoIntent({ searchTerm: 'apple' }, 'es', 0.8);
    expect(result.data.items[0].nameEs).toBeNull();
    expect(result.data.items[0].category).toBeNull();
    expect(result.data.items[0].sku).toBeNull();
    expect(result.data.items[0].prices[0].sellPrice).toBeNull();
  });
});
