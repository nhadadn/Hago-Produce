import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

interface CreateSupplierData {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

interface UpdateSupplierData {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export class SupplierService {
  async createSupplier(data: CreateSupplierData) {
    return prisma.supplier.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
      },
    });
  }

  async getSupplierById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
    });
  }

  async getSupplierByName(name: string) {
    return prisma.supplier.findUnique({
      where: { name },
    });
  }

  async updateSupplier(id: string, data: UpdateSupplierData) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async getSuppliers(filters: SupplierFilters) {
    const { page = 1, limit = 10, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const supplierService = new SupplierService();
