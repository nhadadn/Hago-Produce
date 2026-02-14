import prisma from '@/lib/db';
import { CustomerInput, CustomerUpdateInput, CustomerFilters } from '@/lib/validation/customers';
import { Prisma } from '@prisma/client';

export class CustomerService {
  static async getAll(filters: CustomerFilters) {
    const { page = 1, limit = 10, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive === true || isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  }

  static async getByTaxId(taxId: string) {
    return prisma.customer.findUnique({ where: { taxId } });
  }

  static async create(data: CustomerInput) {
    const existing = await this.getByTaxId(data.taxId);
    if (existing) {
      throw new Error(`Customer with Tax ID ${data.taxId} already exists`);
    }
    return prisma.customer.create({ data });
  }

  static async update(id: string, data: CustomerUpdateInput) {
    if (data.taxId) {
      const existing = await this.getByTaxId(data.taxId);
      if (existing && existing.id !== id) {
        throw new Error(`Customer with Tax ID ${data.taxId} already exists`);
      }
    }
    return prisma.customer.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
