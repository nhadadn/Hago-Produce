import { jest } from '@jest/globals';
import prisma from '@/lib/db';
import { bestSupplierIntent } from '@/lib/services/chat/intents/best-supplier';

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

describe('bestSupplierIntent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Re-apply pass-through after reset
    const textUtils = require('@/lib/services/chat/utils/text-utils');
    textUtils.cleanSearchTerm.mockImplementation((term: string) => term);

    anyPrisma.productPrice = {
      findMany: jest.fn(),
    };
    anyPrisma.product = {
      findMany: jest.fn(),
    };
  });

  it('returns empty result when no searchTerm provided', async () => {
    const result = await bestSupplierIntent({}, 'en', 0.9);

    expect(result.intent).toBe('best_supplier');
    expect(result.data?.items).toEqual([]);
    expect(anyPrisma.productPrice.findMany).not.toHaveBeenCalled();
  });

  it('returns suppliers sorted by costPrice ascending', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-2',
        productId: 'prod-1',
        supplierId: 'sup-2',
        costPrice: 15.0,
        sellPrice: 20.0,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Tomato', nameEs: 'Tomate' },
        supplier: { name: 'Expensive Supplier' },
      },
      {
        id: 'pp-1',
        productId: 'prod-1',
        supplierId: 'sup-1',
        costPrice: 8.0,
        sellPrice: 12.0,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Tomato', nameEs: 'Tomate' },
        supplier: { name: 'Cheap Supplier' },
      },
    ]);

    const result = await bestSupplierIntent({ searchTerm: 'tomato' }, 'en', 0.9);

    expect(result.intent).toBe('best_supplier');
    expect(result.data?.items).toHaveLength(2);
    expect(result.data?.items[0].supplierName).toBe('Cheap Supplier');
    expect(result.data?.items[0].costPrice).toBe(8.0);
    expect(result.data?.items[1].supplierName).toBe('Expensive Supplier');
    expect(result.data?.items[0].rank).toBe(1);
    expect(result.data?.items[1].rank).toBe(2);
  });

  it('filters out records where costPrice converts to NaN', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-good',
        productId: 'prod-1',
        supplierId: 'sup-1',
        costPrice: 10.0,
        sellPrice: null,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Apple', nameEs: 'Manzana' },
        supplier: { name: 'Good Supplier' },
      },
      {
        id: 'pp-bad',
        productId: 'prod-1',
        supplierId: 'sup-2',
        costPrice: 'not-a-number',
        sellPrice: null,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Apple', nameEs: 'Manzana' },
        supplier: { name: 'Bad Data Supplier' },
      },
    ]);

    const result = await bestSupplierIntent({ searchTerm: 'apple' }, 'en', 0.9);

    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].supplierName).toBe('Good Supplier');
  });

  it('returns suggestions when no prices found', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([]);
    anyPrisma.product.findMany.mockResolvedValue([
      { name: 'Tomato', nameEs: 'Tomate' },
      { name: 'Tomatillo', nameEs: 'Tomatillo' },
    ]);

    const result = await bestSupplierIntent({ searchTerm: 'toma' }, 'en', 0.8);

    expect(result.data?.items).toEqual([]);
    expect(result.data?.suggestions).toEqual(['Tomato', 'Tomatillo']);
    expect(anyPrisma.product.findMany).toHaveBeenCalled();
  });

  it('limits results when maxResults param is provided', async () => {
    const prices = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
      id: `pp-${n}`,
      productId: 'prod-1',
      supplierId: `sup-${n}`,
      costPrice: n * 2.0,
      sellPrice: null,
      currency: 'CAD',
      effectiveDate: new Date('2024-01-01'),
      product: { name: 'Pepper', nameEs: 'Pimiento' },
      supplier: { name: `Supplier ${n}` },
    }));

    anyPrisma.productPrice.findMany.mockResolvedValue(prices);

    const result = await bestSupplierIntent({ searchTerm: 'pepper', maxResults: 3 }, 'en', 0.9);

    expect(result.data?.items).toHaveLength(3);
  });

  it('maps sellPrice as null when it is null (no crash)', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-nosell',
        productId: 'prod-1',
        supplierId: 'sup-1',
        costPrice: 5.0,
        sellPrice: null,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Garlic', nameEs: 'Ajo' },
        supplier: { name: 'Garlic Farm' },
      },
    ]);

    const result = await bestSupplierIntent({ searchTerm: 'garlic' }, 'en', 0.9);

    expect(result.data?.items[0].sellPrice).toBeNull();
    expect(result.data?.items[0].costPrice).toBe(5.0);
  });

  it('returns suggestions in Spanish when language is es', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([]);
    anyPrisma.product.findMany.mockResolvedValue([
      { name: 'Lettuce', nameEs: 'Lechuga' },
    ]);

    const result = await bestSupplierIntent({ searchTerm: 'lech' }, 'es', 0.8);

    expect(result.data?.suggestions).toEqual(['Lechuga']);
  });

  it('uses default limit of 5 when maxResults is invalid', async () => {
    const prices = Array.from({ length: 8 }, (_, n) => ({
      id: `pp-${n}`,
      productId: 'prod-1',
      supplierId: `sup-${n}`,
      costPrice: (n + 1) * 3.0,
      sellPrice: null,
      currency: 'CAD',
      effectiveDate: new Date('2024-01-01'),
      product: { name: 'Carrot', nameEs: 'Zanahoria' },
      supplier: { name: `Supplier ${n}` },
    }));

    anyPrisma.productPrice.findMany.mockResolvedValue(prices);

    // maxResults = 0 is invalid, should fall back to default 5
    const result = await bestSupplierIntent({ searchTerm: 'carrot', maxResults: 0 }, 'en', 0.9);

    expect(result.data?.items).toHaveLength(5);
  });
});
