import { PriceVersioningService } from '@/lib/services/pricing/price-versioning.service';
import prisma from '@/tests/integration/utils/db';

// Mock lib/db to use our test DB instance
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: require('@/tests/integration/utils/db').default,
}));

// Helper to clean up DB
const cleanup = async () => {
  await prisma.priceVersion.deleteMany();
  await prisma.priceList.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
};

describe('PriceVersioningService Integration', () => {
  let service: PriceVersioningService;

  beforeAll(async () => {
    service = new PriceVersioningService();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanup();
  });

  const createSupplier = async (name: string) => {
    return prisma.supplier.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s/g, '')}@test.com`,
      },
    });
  };

  const createProduct = async (name: string) => {
    return prisma.product.create({
      data: {
        name,
        unit: 'kg',
      },
    });
  };

  describe('Full Flow: Create List -> Create Versions -> Lookup', () => {
    it('should manage price versions correctly through time', async () => {
      // 1. Setup Supplier and Product
      const supplier = await createSupplier('Supplier Integration');
      const product = await createProduct('Product Integration');

      // 2. Create Initial Price List
      const validFrom1 = new Date('2024-01-01');
      const list1 = await service.createPriceList(supplier.id, '2024 List', validFrom1);
      
      expect(list1.isCurrent).toBe(true);

      // 3. Create Version 1 (Jan - June)
      const v1Start = new Date('2024-01-01');
      const v1End = new Date('2024-06-30');
      const v1 = await service.createPriceVersion(
        supplier.id, 
        product.id, 
        10.0, 
        v1Start, 
        v1End
      );
      
      expect(v1.price.toNumber()).toBe(10.0);

      // 4. Create Version 2 (July - Dec)
      const v2Start = new Date('2024-07-01');
      const v2End = new Date('2024-12-31');
      const v2 = await service.createPriceVersion(
        supplier.id, 
        product.id, 
        12.0, 
        v2Start, 
        v2End
      );

      expect(v2.price.toNumber()).toBe(12.0);

      // 5. Lookup Prices at different dates
      
      // Date in V1 range
      const priceMar = await service.getCurrentPrice(supplier.id, product.id, new Date('2024-03-15'));
      expect(priceMar?.id).toBe(v1.id);
      expect(priceMar?.price.toNumber()).toBe(10.0);

      // Date in V2 range
      const priceAug = await service.getCurrentPrice(supplier.id, product.id, new Date('2024-08-15'));
      expect(priceAug?.id).toBe(v2.id);
      expect(priceAug?.price.toNumber()).toBe(12.0);

      // Date outside range (2025)
      const price2025 = await service.getCurrentPrice(supplier.id, product.id, new Date('2025-01-01'));
      expect(price2025).toBeNull();
    });
  });

  describe('Business Rules', () => {
    it('should ensure only one active price list per supplier', async () => {
      const supplier = await createSupplier('Supplier Unique');
      
      // List 1
      const list1 = await service.createPriceList(supplier.id, 'List 1', new Date('2024-01-01'));
      expect(list1.isCurrent).toBe(true);

      // List 2
      const list2 = await service.createPriceList(supplier.id, 'List 2', new Date('2024-02-01'));
      expect(list2.isCurrent).toBe(true);

      // Verify List 1 is no longer current
      const updatedList1 = await prisma.priceList.findUnique({ where: { id: list1.id } });
      expect(updatedList1?.isCurrent).toBe(false);
    });

    it('should prevent overlapping versions', async () => {
      const supplier = await createSupplier('Supplier Overlap');
      const product = await createProduct('Product Overlap');
      
      await service.createPriceList(supplier.id, 'List Overlap', new Date('2024-01-01'));

      // Version 1: Jan - Mar
      await service.createPriceVersion(
        supplier.id, 
        product.id, 
        10.0, 
        new Date('2024-01-01'), 
        new Date('2024-03-31')
      );

      // Try overlapping Version (Feb - Apr) -> Should fail
      await expect(service.createPriceVersion(
        supplier.id, 
        product.id, 
        11.0, 
        new Date('2024-02-01'), 
        new Date('2024-04-30')
      )).rejects.toThrow('overlap');
    });

    it('should handle open-ended versions correctly', async () => {
      const supplier = await createSupplier('Supplier Open');
      const product = await createProduct('Product Open');
      
      await service.createPriceList(supplier.id, 'List Open', new Date('2024-01-01'));

      // Version 1: Jan onwards (open)
      const v1 = await service.createPriceVersion(
        supplier.id, 
        product.id, 
        10.0, 
        new Date('2024-01-01')
      );
      
      expect(v1.validTo).toBeNull();

      // Lookup far in future
      const priceFuture = await service.getCurrentPrice(supplier.id, product.id, new Date('2099-01-01'));
      expect(priceFuture?.id).toBe(v1.id);
    });
  });
});
