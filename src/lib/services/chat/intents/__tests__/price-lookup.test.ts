import { jest } from '@jest/globals';
import prisma from '@/lib/db';
import { priceLookupIntent } from '@/lib/services/chat/intents/price-lookup';

// Mock logger to avoid infrastructure dependencies
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock text-utils to control cleanSearchTerm behavior (pass-through by default)
jest.mock('@/lib/services/chat/utils/text-utils', () => ({
  cleanSearchTerm: jest.fn((term: string) => term),
}));

const anyPrisma = prisma as any;

describe('priceLookupIntent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Re-apply pass-through for cleanSearchTerm after reset
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
    const result = await priceLookupIntent({}, 'en', 0.9);

    expect(result.intent).toBe('price_lookup');
    expect(result.data?.items).toEqual([]);
    expect(anyPrisma.productPrice.findMany).not.toHaveBeenCalled();
  });

  it('returns prices with sellPrice when prices are found', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-1',
        productId: 'prod-1',
        supplierId: 'sup-1',
        sellPrice: 15.5,
        costPrice: 10.0,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Apple', nameEs: 'Manzana' },
        supplier: { name: 'Supplier A' },
      },
    ]);

    const result = await priceLookupIntent({ searchTerm: 'apple' }, 'en', 0.9);

    expect(result.intent).toBe('price_lookup');
    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].sellPrice).toBe(15.5);
    expect(result.data?.items[0].displayPriceType).toBe('sell');
    expect(result.data?.items[0].displayPrice).toBe(15.5);
  });

  it('returns cost price when sellPrice is null', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-2',
        productId: 'prod-2',
        supplierId: 'sup-2',
        sellPrice: null,
        costPrice: 8.0,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Banana', nameEs: 'Banano' },
        supplier: { name: 'Supplier B' },
      },
    ]);

    const result = await priceLookupIntent({ searchTerm: 'banana' }, 'en', 0.9);

    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].sellPrice).toBeNull();
    expect(result.data?.items[0].costPrice).toBe(8.0);
    expect(result.data?.items[0].displayPriceType).toBe('cost');
    expect(result.data?.items[0].displayPrice).toBe(8.0);
  });

  it('returns suggestions when no prices found', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([]);
    anyPrisma.product.findMany.mockResolvedValue([
      { name: 'Apple', nameEs: 'Manzana' },
      { name: 'Apricot', nameEs: 'Albaricoque' },
    ]);

    const result = await priceLookupIntent({ searchTerm: 'app' }, 'en', 0.8);

    expect(result.data?.items).toEqual([]);
    expect(result.data?.suggestions).toEqual(['Apple', 'Apricot']);
    expect(anyPrisma.product.findMany).toHaveBeenCalled();
  });

  it('returns suggestions in Spanish when language is es', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([]);
    anyPrisma.product.findMany.mockResolvedValue([
      { name: 'Apple', nameEs: 'Manzana' },
    ]);

    const result = await priceLookupIntent({ searchTerm: 'man' }, 'es', 0.8);

    expect(result.data?.suggestions).toEqual(['Manzana']);
  });

  it('filters by supplier when supplierName param is provided', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-3',
        productId: 'prod-1',
        supplierId: 'sup-1',
        sellPrice: 20.0,
        costPrice: 15.0,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Apple', nameEs: 'Manzana' },
        supplier: { name: 'FarmFresh' },
      },
    ]);

    await priceLookupIntent({ searchTerm: 'apple', supplierName: 'FarmFresh' }, 'en', 0.9);

    const callArgs = anyPrisma.productPrice.findMany.mock.calls[0][0];
    expect(callArgs.where.supplier).toBeDefined();
    expect(callArgs.where.supplier.name.contains).toBe('FarmFresh');
  });

  it('skips records where both sellPrice and costPrice are null', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-good',
        productId: 'prod-1',
        supplierId: 'sup-1',
        sellPrice: 10.0,
        costPrice: 8.0,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Apple', nameEs: 'Manzana' },
        supplier: { name: 'Supplier A' },
      },
      {
        id: 'pp-bad',
        productId: 'prod-2',
        supplierId: 'sup-2',
        sellPrice: null,
        costPrice: null,
        currency: 'CAD',
        effectiveDate: new Date('2024-01-01'),
        product: { name: 'Orange', nameEs: 'Naranja' },
        supplier: { name: 'Supplier B' },
      },
    ]);

    const result = await priceLookupIntent({ searchTerm: 'fruit' }, 'en', 0.9);

    // Only the record with valid prices should appear
    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.items[0].productName).toBe('Apple');
  });

  it('returns undefined effectiveDate when effectiveDate is null', async () => {
    anyPrisma.productPrice.findMany.mockResolvedValue([
      {
        id: 'pp-5',
        productId: 'prod-1',
        supplierId: 'sup-1',
        sellPrice: 12.0,
        costPrice: 9.0,
        currency: 'CAD',
        effectiveDate: null,
        product: { name: 'Cherry', nameEs: 'Cereza' },
        supplier: { name: 'Supplier C' },
      },
    ]);

    const result = await priceLookupIntent({ searchTerm: 'cherry' }, 'en', 0.9);

    expect(result.data?.items[0].effectiveDate).toBeUndefined();
  });
});
