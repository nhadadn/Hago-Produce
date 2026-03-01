import { PriceVersioningService } from '@/lib/services/pricing/price-versioning.service';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { Prisma } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/db', () => {
  const mockClient = {
    priceList: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    priceVersion: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // Implement transaction to call callback with the mockClient itself
  mockClient.$transaction.mockImplementation((callback: any) => callback(mockClient));

  return {
    __esModule: true,
    default: mockClient,
  };
});

jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('PriceVersioningService', () => {
  let service: PriceVersioningService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PriceVersioningService();
  });

  describe('createPriceVersion', () => {
    const supplierId = 'supplier-1';
    const productId = 'product-1';
    const price = 100.50;
    const validFrom = new Date('2024-01-01');
    const validTo = new Date('2024-12-31');

    it('should create a price version successfully when no overlap', async () => {
      // Mock active price list found
      (prisma.priceList.findFirst as jest.Mock).mockResolvedValue({ id: 'list-1' });
      // Mock no overlap
      (prisma.priceVersion.findFirst as jest.Mock).mockResolvedValue(null);
      // Mock creation
      const mockCreatedVersion = {
        id: 'version-1',
        priceListId: 'list-1',
        productId,
        price: new Prisma.Decimal(price),
        validFrom,
        validTo,
      };
      (prisma.priceVersion.create as jest.Mock).mockResolvedValue(mockCreatedVersion);

      const result = await service.createPriceVersion(supplierId, productId, price, validFrom, validTo);

      expect(prisma.priceList.findFirst).toHaveBeenCalledWith({
        where: { supplierId, isCurrent: true },
      });
      expect(prisma.priceVersion.create).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedVersion);
    });

    it('should handle validTo being undefined (open-ended)', async () => {
      (prisma.priceList.findFirst as jest.Mock).mockResolvedValue({ id: 'list-1' });
      (prisma.priceVersion.findFirst as jest.Mock).mockResolvedValue(null);
      const mockCreatedVersion = {
        id: 'version-1',
        validTo: null,
      };
      (prisma.priceVersion.create as jest.Mock).mockResolvedValue(mockCreatedVersion);

      await service.createPriceVersion(supplierId, productId, price, validFrom);

      expect(prisma.priceVersion.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ validTo: null }),
      }));
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('open-ended'));
    });

    it('should throw error if no active price list found', async () => {
      (prisma.priceList.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.createPriceVersion(supplierId, productId, price, validFrom))
        .rejects.toThrow('No active price list found');
      
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should throw error if overlap detected', async () => {
      (prisma.priceList.findFirst as jest.Mock).mockResolvedValue({ id: 'list-1' });
      // Mock overlap found
      (prisma.priceVersion.findFirst as jest.Mock).mockResolvedValue({
        id: 'overlap-v1',
        validFrom: new Date('2023-01-01'),
        validTo: new Date('2025-01-01'),
      });

      await expect(service.createPriceVersion(supplierId, productId, price, validFrom))
        .rejects.toThrow('Price version overlap detected');
      
      expect(logger.error).toHaveBeenCalled();
      expect(prisma.priceVersion.create).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentPrice', () => {
    const supplierId = 'supplier-1';
    const productId = 'product-1';
    const date = new Date('2024-06-01');

    it('should return current price if found', async () => {
      const mockVersion = { id: 'version-1', price: new Prisma.Decimal(100) };
      (prisma.priceVersion.findFirst as jest.Mock).mockResolvedValue(mockVersion);

      const result = await service.getCurrentPrice(supplierId, productId, date);

      expect(prisma.priceVersion.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          productId,
          validFrom: { lte: date },
        }),
      }));
      expect(result).toEqual(mockVersion);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle validTo null correctly', async () => {
      const mockVersion = { id: 'version-1', validTo: null };
      (prisma.priceVersion.findFirst as jest.Mock).mockResolvedValue(mockVersion);

      await service.getCurrentPrice(supplierId, productId); // Default date = now

      expect(prisma.priceVersion.findFirst).toHaveBeenCalled();
    });

    it('should return null and log warning if not found', async () => {
      (prisma.priceVersion.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getCurrentPrice(supplierId, productId, date);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No current price found'));
    });
  });

  describe('createPriceList', () => {
    const supplierId = 'supplier-1';
    const name = 'New List';
    const validFrom = new Date('2024-01-01');

    it('should create price list and deactivate others in transaction', async () => {
      const mockCreatedList = { id: 'list-1', name, isCurrent: true };
      
      // Setup transaction mock behavior
      // The mocked $transaction calls the callback with mockPrisma
      (prisma.priceList.create as jest.Mock).mockResolvedValue(mockCreatedList);

      const result = await service.createPriceList(supplierId, name, validFrom);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.priceList.updateMany).toHaveBeenCalledWith({
        where: { supplierId, isCurrent: true },
        data: { isCurrent: false },
      });
      expect(prisma.priceList.create).toHaveBeenCalledWith({
        data: { supplierId, name, validFrom, isCurrent: true },
      });
      expect(result).toEqual(mockCreatedList);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should log error and throw if transaction fails', async () => {
      const error = new Error('Tx failed');
      (prisma.$transaction as jest.Mock).mockRejectedValue(error);

      await expect(service.createPriceList(supplierId, name, validFrom))
        .rejects.toThrow('Tx failed');
      
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
