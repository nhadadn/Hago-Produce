import prisma from '@/lib/db';
import { Prisma, PriceVersion, PriceList } from '@prisma/client';
import { logger } from '@/lib/logger/logger.service';

export interface IPriceVersioner {
  /**
   * Creates a new price version for a product.
   * Validates date overlaps with existing versions.
   */
  createPriceVersion(
    supplierId: string,
    productId: string,
    price: Prisma.Decimal | number,
    validFrom: Date,
    validTo?: Date
  ): Promise<PriceVersion>;

  /**
   * Gets the currently valid price for a product.
   */
  getCurrentPrice(
    supplierId: string,
    productId: string,
    date?: Date
  ): Promise<PriceVersion | null>;

  /**
   * Creates a new price list for a supplier.
   * Ensures only one price list is current for the supplier.
   */
  createPriceList(
    supplierId: string,
    name: string,
    validFrom: Date
  ): Promise<PriceList>;
}

export class PriceVersioningService implements IPriceVersioner {
  /**
   * Creates a new price version for a product in the active price list of a supplier.
   * Validates that there are no overlapping versions for the same product.
   * 
   * @param supplierId - The ID of the supplier
   * @param productId - The ID of the product
   * @param price - The price amount
   * @param validFrom - Start date of validity
   * @param validTo - End date of validity (optional, defaults to open-ended)
   * @returns The created PriceVersion
   * @throws Error if no active price list found or if date overlap detected
   * 
   * @example
   * ```ts
   * const version = await service.createPriceVersion(
   *   'supplier-123',
   *   'product-456',
   *   150.00,
   *   new Date('2024-01-01'),
   *   new Date('2024-12-31')
   * );
   * ```
   */
  async createPriceVersion(
    supplierId: string,
    productId: string,
    price: Prisma.Decimal | number,
    validFrom: Date,
    validTo?: Date
  ): Promise<PriceVersion> {
    try {
      // 1. Find the active price list for the supplier
      const priceList = await prisma.priceList.findFirst({
        where: {
          supplierId,
          isCurrent: true,
        },
      });

      if (!priceList) {
        logger.warn(`[PriceVersioningService] No active price list found for supplier ${supplierId}`);
        throw new Error(`No active price list found for supplier ${supplierId}`);
      }

      // 2. Validate date overlap
      // We need to check if any existing version for this product in this list overlaps with the new range
      const overlapping = await prisma.priceVersion.findFirst({
        where: {
          priceListId: priceList.id,
          productId,
          OR: [
            {
              // Case 1: Existing starts within new range
              validFrom: {
                gte: validFrom,
                lte: validTo || new Date('9999-12-31'),
              },
            },
            {
              // Case 2: Existing ends within new range
              validTo: {
                gte: validFrom,
                lte: validTo || new Date('9999-12-31'),
              },
            },
            {
              // Case 3: New range is fully contained in existing range
              validFrom: { lte: validFrom },
              validTo: { gte: validTo || new Date('9999-12-31') },
            },
            {
               // Case 4: Existing is open-ended (validTo null) and starts before new ends (or new is open-ended)
               validTo: null,
               validFrom: { lte: validTo || new Date('9999-12-31') }
            }
          ],
        },
      });

      if (overlapping) {
        const errorMsg = `Price version overlap detected for product ${productId} in list ${priceList.id}. Overlapping version: ${overlapping.id} (${overlapping.validFrom} - ${overlapping.validTo})`;
        logger.error(`[PriceVersioningService] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      if (!validTo) {
          logger.warn(`[PriceVersioningService] Creating open-ended price version for product ${productId}`);
      }

      // 3. Create the price version
      const priceVersion = await prisma.priceVersion.create({
        data: {
          priceListId: priceList.id,
          productId,
          price: new Prisma.Decimal(price),
          validFrom,
          validTo: validTo || null,
        },
      });

      logger.debug(`[PriceVersioningService] Created price version ${priceVersion.id} for product ${productId}`);
      return priceVersion;

    } catch (error) {
      if (error instanceof Error && error.message.includes('overlap')) {
          throw error;
      }
      // If it's not our custom error, log it
      logger.error(`[PriceVersioningService] Error creating price version`, error);
      throw error;
    }
  }

  /**
   * Gets the current valid price for a product from a supplier.
   * Checks the active price list and looks for a version valid at the given date.
   * 
   * @param supplierId - The ID of the supplier
   * @param productId - The ID of the product
   * @param date - The date to check price for (defaults to now)
   * @returns The matching PriceVersion or null if not found
   * @throws Error if database query fails
   * 
   * @example
   * ```ts
   * const currentPrice = await service.getCurrentPrice(
   *   'supplier-123',
   *   'product-456'
   * );
   * 
   * const historicPrice = await service.getCurrentPrice(
   *   'supplier-123',
   *   'product-456',
   *   new Date('2023-12-25')
   * );
   * ```
   */
  async getCurrentPrice(
    supplierId: string,
    productId: string,
    date: Date = new Date()
  ): Promise<PriceVersion | null> {
    try {
      const priceVersion = await prisma.priceVersion.findFirst({
        where: {
          productId,
          priceList: {
            supplierId,
            isCurrent: true,
          },
          validFrom: { lte: date },
          OR: [
            { validTo: { gte: date } },
            { validTo: null },
          ],
        },
        orderBy: {
          validFrom: 'desc', // Prefer the most recent start date
        },
      });

      if (!priceVersion) {
        logger.warn(`[PriceVersioningService] No current price found for supplier ${supplierId}, product ${productId} at ${date}`);
        return null;
      }

      logger.debug(`[PriceVersioningService] Found current price ${priceVersion.id} for product ${productId}`);
      return priceVersion;

    } catch (error) {
      logger.error(`[PriceVersioningService] Error getting current price`, error);
      throw error;
    }
  }

  /**
   * Creates a new price list for a supplier.
   * Ensures that only one price list is marked as current for the supplier.
   * 
   * @param supplierId - The ID of the supplier
   * @param name - The name of the price list
   * @param validFrom - Start date of validity
   * @returns The created PriceList
   * @throws Error if transaction fails
   * 
   * @example
   * ```ts
   * const list = await service.createPriceList(
   *   'supplier-123',
   *   'Summer 2024',
   *   new Date('2024-06-01')
   * );
   * ```
   */
  async createPriceList(
    supplierId: string,
    name: string,
    validFrom: Date
  ): Promise<PriceList> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Mark existing current price lists as not current
        await tx.priceList.updateMany({
          where: {
            supplierId,
            isCurrent: true,
          },
          data: {
            isCurrent: false,
          },
        });

        // 2. Create the new price list
        const priceList = await tx.priceList.create({
          data: {
            supplierId,
            name,
            validFrom,
            isCurrent: true,
          },
        });

        logger.debug(`[PriceVersioningService] Created new active price list ${priceList.id} for supplier ${supplierId}`);
        return priceList;
      });
    } catch (error) {
      logger.error(`[PriceVersioningService] Error creating price list`, error);
      throw error;
    }
  }
}
