import prisma from '@/lib/db';
import { ProductPriceInput, ProductPriceFilters } from '@/lib/validation/product-price';

export class ProductPriceService {
  static async getAll(filters: ProductPriceFilters) {
    const { productId, supplierId, isCurrent, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (productId) where.productId = productId;
    if (supplierId) where.supplierId = supplierId;
    
    // Comprobar explícitamente boolean true/false, o string 'true'/'false' si viene de query params
    if (isCurrent !== undefined) {
      where.isCurrent = isCurrent === true || isCurrent === 'true';
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

  static async create(data: ProductPriceInput) {
    return prisma.$transaction(async (tx) => {
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
