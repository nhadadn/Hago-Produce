import prisma from '@/lib/db';
import { ProductPriceInput, ProductPriceFilters, ProductPriceUpdateInput } from '@/lib/validation/product-price';
import { logger } from '@/lib/logger/logger.service';
import { PriceVersioningService } from '@/lib/services/pricing/price-versioning.service';

export class ProductPriceService {
  static async getAll(filters: ProductPriceFilters) {
    const { productId, supplierId, isCurrent, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (productId) where.productId = productId;
    if (supplierId) where.supplierId = supplierId;
    
    // Comprobar explícitamente boolean true/false, o string 'true'/'false' si viene de query params
    if (isCurrent !== undefined) {
      where.isCurrent = isCurrent === true || (isCurrent as any) === 'true';
    }

    const [prices, total] = await Promise.all([
      prisma.productPrice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { effectiveDate: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      prisma.productPrice.count({ where }),
    ]);

    return {
      prices,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    return prisma.productPrice.findUnique({
      where: { id },
      include: {
        product: true,
        supplier: true,
      },
    });
  }

  static async update(id: string, data: ProductPriceUpdateInput) {
    // 1. Get existing price
    const existing = await prisma.productPrice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Product price not found');
    }

    let result;

    // 2. Handle isCurrent update with transaction if needed
    if (data.isCurrent === true && !existing.isCurrent) {
      result = await prisma.$transaction(async (tx) => {
        // Mark others as not current
        await tx.productPrice.updateMany({
          where: {
            productId: existing.productId,
            supplierId: existing.supplierId,
            isCurrent: true,
            id: { not: id },
          },
          data: { isCurrent: false },
        });

        return tx.productPrice.update({
          where: { id },
          data,
        });
      });
    } else {
      // Simple update
      result = await prisma.productPrice.update({
        where: { id },
        data,
      });
    }

    // 3. Sync to PriceVersion (Dual Write)
    // If price or date changed, we create a new version in the PriceList system
    if (data.costPrice !== undefined || data.effectiveDate) {
      try {
        const priceVersioning = new PriceVersioningService();
        
        // Ensure active PriceList exists
        let priceList = await prisma.priceList.findFirst({
          where: { 
            supplierId: existing.supplierId, 
            isCurrent: true 
          }
        });

        if (!priceList) {
          priceList = await priceVersioning.createPriceList(
            existing.supplierId,
            `Lista General ${new Date().getFullYear()}`,
            new Date()
          );
        }

        // Create new version with updated values or fallback to existing
        const newPrice = data.costPrice !== undefined ? data.costPrice : Number(existing.costPrice);
        const newDate = data.effectiveDate || existing.effectiveDate;

        await priceVersioning.createPriceVersion(
          existing.supplierId,
          existing.productId,
          newPrice,
          newDate
        );
        
        logger.info(`[ProductPriceService] Synced update to PriceVersion for product ${existing.productId}`);
      } catch (error) {
        logger.error('[ProductPriceService] Failed to sync update to PriceVersion', error);
      }
    }

    return result;
  }

  static async create(data: ProductPriceInput) {
    const result = await prisma.$transaction(async (tx) => {
      if (data.isCurrent) {
        // Marcar precios actuales anteriores para este producto-proveedor como no actuales
        await tx.productPrice.updateMany({
          where: {
            productId: data.productId,
            supplierId: data.supplierId,
            isCurrent: true,
          },
          data: { isCurrent: false },
        });
      }
      
      return tx.productPrice.create({
        data,
      });
    });

    // Sync to PriceVersion (Dual Write)
    try {
      const priceVersioning = new PriceVersioningService();
      
      // Ensure active PriceList exists
      let priceList = await prisma.priceList.findFirst({
        where: { supplierId: data.supplierId, isCurrent: true }
      });

      if (!priceList) {
        priceList = await priceVersioning.createPriceList(
          data.supplierId,
          `Lista General ${new Date().getFullYear()}`,
          new Date()
        );
      }

      await priceVersioning.createPriceVersion(
        data.supplierId,
        data.productId,
        data.costPrice,
        data.effectiveDate || new Date()
      );
      
      logger.info(`[ProductPriceService] Synced price to PriceVersion for product ${data.productId}`);
    } catch (error) {
      logger.error('[ProductPriceService] Failed to sync to PriceVersion', error);
      // We don't throw here to avoid breaking legacy flow, but we log explicitly
    }

    return result;
  }

  static async bulkUpdateFromMake(payload: { source: string, prices: any[] }) {
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      details: [] as any[],
    };

    for (const item of payload.prices) {
      try {
        // 1. Buscar Producto
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { name: { equals: item.product_name, mode: 'insensitive' } },
              { nameEs: { equals: item.product_name, mode: 'insensitive' } }
            ]
          }
        });

        if (!product) {
          results.errors++;
          results.details.push({ 
            product: item.product_name, 
            supplier: item.supplier_name, 
            status: 'error', 
            message: 'Product not found' 
          });
          results.processed++;
          continue;
        }

        // 2. Buscar o Crear Proveedor
        let supplier = await prisma.supplier.findUnique({
          where: { name: item.supplier_name }
        });

        if (!supplier) {
          // ¿Deberíamos crear el proveedor? La tarea implica "crea si no existe, según configuración"
          // Asumiendo que lo creamos por ahora para asegurar el flujo de datos
          supplier = await prisma.supplier.create({
            data: {
              name: item.supplier_name,
              isActive: true,
            }
          });
        }

        // 3. Crear Precio
        await this.create({
          productId: product.id,
          supplierId: supplier.id,
          costPrice: Number(item.cost_price),
          currency: item.currency || 'USD',
          effectiveDate: new Date(),
          isCurrent: true,
          source: payload.source,
          // sellPrice is optional
        });

        results.created++;
        results.details.push({
          product: item.product_name,
          supplier: item.supplier_name,
          status: 'created'
        });

      } catch (error: any) {
        logger.error(`Error processing bulk update item for product: ${item.product_name}`, error);
        results.errors++;
        results.details.push({
          product: item.product_name,
          supplier: item.supplier_name,
          status: 'error',
          message: error.message
        });
      }
      results.processed++;
    }

    return results;
  }
}
