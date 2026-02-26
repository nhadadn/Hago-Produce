import prisma from '@/lib/db';
import { CustomerInput, CustomerUpdateInput, CustomerFilters } from '@/lib/validation/customers';
import { Prisma, Role } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';

function generateInitialPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

  static async create(data: CustomerInput): Promise<{ customer: Awaited<ReturnType<typeof prisma.customer.create>>; portalPassword: string }> {
    const existing = await this.getByTaxId(data.taxId);
    if (existing) {
      throw new Error(`Customer with Tax ID ${data.taxId} already exists`);
    }

    const plainPassword = generateInitialPassword();
    const hashedPassword = await hashPassword(plainPassword);

    // Email para el User: el del cliente si existe, sino un placeholder único
    const userEmail = data.email && data.email.trim() !== ''
      ? data.email
      : `portal.${data.taxId.toLowerCase().replace(/[^a-z0-9]/g, '')}@noreply.hagoproduce.com`;

    const customer = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({ data });

      await tx.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          firstName: data.name,
          role: Role.CUSTOMER,
          customerId: newCustomer.id,
          isActive: true,
        },
      });

      return newCustomer;
    });

    return { customer, portalPassword: plainPassword };
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
