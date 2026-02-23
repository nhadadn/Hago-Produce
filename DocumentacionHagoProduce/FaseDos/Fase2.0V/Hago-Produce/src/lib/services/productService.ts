import prisma from '@/lib/db';
import { ProductFilters, ProductInput, ProductUpdateInput } from '@/lib/validation/product';

export class ProductService {
  static async getAll(filters: ProductFilters) {
    const { search, category, isActive, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEs: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (isActive) {
      where.isActive = isActive === 'true';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  static async create(data: ProductInput) {
    return prisma.product.create({ data });
  }

  static async update(id: string, data: ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  }

  static async delete(id: string) {
    // Soft delete if possible, but schema has deletedAt, so we update
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
