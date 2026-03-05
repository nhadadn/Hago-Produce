import { jest } from '@jest/globals';
import prisma from '@/lib/db';
import { productInfoIntent } from '@/lib/services/chat/intents/product-info';

// Mock logger to avoid infrastructure dependencies
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock text-utils pass-through
jest.mock('@/lib/services/chat/utils/text-utils', () => ({
  cleanSearchTerm: jest.fn((term: string) => term),
}));

const anyPrisma = prisma as any;

describe('productInfoIntent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Re-apply pass-through after reset
    const textUtils = require('@/lib/services/chat/utils/text-utils');
    textUtils.cleanSearchTerm.mockImplementation((term: string) => term);

    anyPrisma.product = {
      findMany: jest.fn(),
    };
  });

  it('returns empty result when no params provided', async () => {
    const result = await productInfoIntent({}, 'en', 0.9);

    expect(result.intent).toBe('product_info');
    expect(result.data?.items).toEqual([]);
    expect(anyPrisma.product.findMany).not.toHaveBeenCalled();
  });

  it('returns product info with prices when active product is found', async () => {
    anyPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Tomato',
        nameEs: 'Tomate',
        description: 'Fresh tomatoes',
        category: 'Vegetables',
        unit: 'kg',
        sku: 'TOM-001',
        prices: [
          {
            id: 'price-1',
            supplierId: 'sup-1',
            costPrice: 5.0,
            sellPrice: 8.0,
            currency: 'CAD',
            effectiveDate: new Date('2024-01-01'),
            supplier: { name: 'FarmCo' },
          },
        ],
      },
    ]);

    const result = await productInfoIntent({ productName: 'tomato' }, 'en', 0.9);

    expect(result.intent).toBe('product_info');
    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].name).toBe('Tomato');
    expect(result.data?.items[0].prices).toHaveLength(1);
    expect(result.data?.items[0].prices[0].sellPrice).toBe(8.0);
    expect(result.data?.items[0].prices[0].displayPriceType).toBe('sell');
    expect(result.sources).toHaveLength(1);
  });

  it('returns product with empty prices and null lowestPrice when no prices exist', async () => {
    anyPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-2',
        name: 'Rare Fruit',
        nameEs: 'Fruta Rara',
        description: null,
        category: 'Fruits',
        unit: 'unit',
        sku: 'RF-001',
        prices: [],
      },
    ]);

    const result = await productInfoIntent({ productName: 'rare fruit' }, 'en', 0.9);

    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].prices).toEqual([]);
    expect(result.data?.items[0].lowestPrice).toBeNull();
  });

  it('returns inactive product message when product exists but is not active', async () => {
    // First call: active search returns empty
    // Second call: inactive search returns the product
    anyPrisma.product.findMany
      .mockResolvedValueOnce([]) // active products query
      .mockResolvedValueOnce([  // inactive products query
        { name: 'Old Vegetable', nameEs: 'Vegetal Viejo', isActive: false },
      ]);

    const result = await productInfoIntent({ productName: 'old vegetable' }, 'en', 0.8);

    expect(result.data?.items).toEqual([]);
    expect(result.data?.productFound).toBe(true);
    expect(result.data?.isActive).toBe(false);
    expect(result.data?.message).toContain('Old Vegetable');
    expect(result.data?.message).toContain('inactive');
  });

  it('returns inactive product message in Spanish', async () => {
    anyPrisma.product.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { name: 'Old Vegetable', nameEs: 'Vegetal Viejo', isActive: false },
      ]);

    const result = await productInfoIntent({ productName: 'vegetal' }, 'es', 0.8);

    expect(result.data?.message).toContain('Vegetal Viejo');
    expect(result.data?.message).toContain('inactivo');
  });

  it('returns suggestions when product not found (active or inactive)', async () => {
    // Active query: empty; inactive query: empty; suggestions query: some results
    anyPrisma.product.findMany
      .mockResolvedValueOnce([]) // active
      .mockResolvedValueOnce([]) // inactive
      .mockResolvedValueOnce([  // suggestions
        { name: 'Peach', nameEs: 'Durazno' },
        { name: 'Pear', nameEs: 'Pera' },
      ]);

    const result = await productInfoIntent({ productName: 'pea' }, 'en', 0.7);

    expect(result.data?.items).toEqual([]);
    expect(result.data?.suggestions).toEqual(['Peach', 'Pear']);
  });

  it('does not make fuzzy suggestion query when search term is shorter than 3 chars', async () => {
    anyPrisma.product.findMany
      .mockResolvedValueOnce([]) // active
      .mockResolvedValueOnce([]); // inactive

    const result = await productInfoIntent({ productName: 'ab' }, 'en', 0.5);

    // Only 2 calls (active + inactive), no fuzzy suggestion call
    expect(anyPrisma.product.findMany).toHaveBeenCalledTimes(2);
    expect(result.data?.suggestions).toEqual([]);
  });

  it('falls back to searchTerm param when productName is absent', async () => {
    anyPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-3',
        name: 'Avocado',
        nameEs: 'Aguacate',
        description: null,
        category: 'Fruits',
        unit: 'unit',
        sku: 'AVO-001',
        prices: [],
      },
    ]);

    const result = await productInfoIntent({ searchTerm: 'avocado' }, 'en', 0.85);

    expect(result.data?.items[0].name).toBe('Avocado');
  });

  it('uses cost price as displayPrice when sellPrice is null', async () => {
    anyPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-4',
        name: 'Onion',
        nameEs: 'Cebolla',
        description: null,
        category: 'Vegetables',
        unit: 'kg',
        sku: 'ONI-001',
        prices: [
          {
            id: 'price-2',
            supplierId: 'sup-1',
            costPrice: 3.5,
            sellPrice: null,
            currency: 'CAD',
            effectiveDate: new Date('2024-01-01'),
            supplier: { name: 'VeggieCo' },
          },
        ],
      },
    ]);

    const result = await productInfoIntent({ productName: 'onion' }, 'en', 0.9);

    expect(result.data?.items[0].prices[0].sellPrice).toBeNull();
    expect(result.data?.items[0].prices[0].displayPrice).toBe(3.5);
    expect(result.data?.items[0].prices[0].displayPriceType).toBe('cost');
  });
});
