import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';

export interface PriceVersionData {
  id: string;
  productId: string;
  supplierId: string;
  costPrice: number;
  sellPrice: number | null;
  currency: string;
  effectiveDate: Date;
  isCurrent: boolean;
  source: string | null;
  product: {
    id: string;
    name: string;
    sku: string | null;
    unit: string | null;
  };
  supplier: {
    id: string;
    name: string;
  };
}

export interface PriceVersionFilters {
  productId?: string;
  supplierId?: string;
  isCurrent?: boolean;
  page?: number;
  limit?: number;
}

export interface PriceVersionResult {
  prices: PriceVersionData[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PriceVersionReaderService {
  static async getAll(filters: PriceVersionFilters): Promise<PriceVersionResult> {
    const { productId, supplierId, isCurrent, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    try {
      const now = new Date();
      const where: any = {};
      
      if (productId) {
        where.productId = productId;
      }
      
      if (supplierId) {
        where.priceList = { supplierId };
      }
      
      if (isCurrent === false) {
        where.OR = [
          { priceList: { isCurrent: false } },
          { validFrom: { gt: now } },
          { validTo: { lt: now } },
        ];
      } else {
        where.priceList = {
          ...(where.priceList || {}),
          isCurrent: true,
        };
        where.validFrom = { lte: now };
        where.OR = [{ validTo: null }, { validTo: { gt: now } }];
      }

      const [priceVersions, total] = await Promise.all([
        prisma.priceVersion.findMany({
          where,
          skip,
          take: limit,
          orderBy: { validFrom: 'desc' },
          include: {
            product: { 
              select: { 
                id: true, 
                name: true, 
                sku: true, 
                unit: true 
              } 
            },
            priceList: { 
              select: { 
                id: true, 
                supplierId: true,
                isCurrent: true,
                supplier: { 
                  select: { 
                    id: true, 
                    name: true 
                  } 
                }
              } 
            },
          },
        }),
        prisma.priceVersion.count({ where }),
      ]);

      // Mapear PriceVersion al formato esperado por la pantalla
      const prices: PriceVersionData[] = priceVersions.map(pv => ({
        id: pv.id,
        productId: pv.productId,
        supplierId: pv.priceList.supplierId,
        costPrice: Number(pv.price),
        sellPrice: null, // PriceVersion no tiene sellPrice
        currency: pv.currency,
        effectiveDate: pv.validFrom,
        isCurrent:
          pv.priceList.isCurrent &&
          pv.validFrom <= now &&
          (!pv.validTo || pv.validTo > now),
        source: pv.source,
        product: pv.product,
        supplier: pv.priceList.supplier
      }));

      return {
        prices,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('[PriceVersionReaderService] Error fetching price versions:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<PriceVersionData | null> {
    try {
      const priceVersion = await prisma.priceVersion.findUnique({
        where: { id },
        include: {
          product: { 
            select: { 
              id: true, 
              name: true, 
              sku: true, 
              unit: true 
            } 
          },
          priceList: { 
            select: { 
              id: true, 
              supplierId: true,
              supplier: { 
                select: { 
                  id: true, 
                  name: true 
                } 
              }
            } 
          },
        },
      });

      if (!priceVersion) {
        return null;
      }

      // Verificar si el precio es actual
      const now = new Date();
      const isValid = priceVersion.validFrom <= now && 
        (!priceVersion.validTo || priceVersion.validTo > now);

      return {
        id: priceVersion.id,
        productId: priceVersion.productId,
        supplierId: priceVersion.priceList.supplierId,
        costPrice: Number(priceVersion.price),
        sellPrice: null,
        currency: priceVersion.currency,
        effectiveDate: priceVersion.validFrom,
        isCurrent: isValid,
        source: priceVersion.source,
        product: priceVersion.product,
        supplier: priceVersion.priceList.supplier
      };
    } catch (error) {
      logger.error('[PriceVersionReaderService] Error fetching price version by id:', error);
      throw error;
    }
  }
}
