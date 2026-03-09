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

/** Generates a clean username from a customer name, e.g. "Juan García" → "juangarcia" */
function generateUsernameBase(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '')       // keep only alphanumeric
    .slice(0, 20);
}

async function buildUniqueUsername(name: string): Promise<string> {
  const base = generateUsernameBase(name) || 'cliente';
  let candidate = base;
  let attempt = 1;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${attempt}`;
    attempt++;
  }
  return candidate;
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

  static async create(data: CustomerInput): Promise<{ customer: Awaited<ReturnType<typeof prisma.customer.create>>; portalPassword: string; username: string }> {
    const existing = await this.getByTaxId(data.taxId);
    if (existing) {
      throw new Error(`Customer with Tax ID ${data.taxId} already exists`);
    }

    const plainPassword = generateInitialPassword();
    const hashedPassword = await hashPassword(plainPassword);
    const username = await buildUniqueUsername(data.name);

    const customer = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({ data });

      await tx.user.create({
        data: {
          email: data.email,
          username,
          password: hashedPassword,
          firstName: data.name,
          role: Role.CUSTOMER,
          customerId: newCustomer.id,
          isActive: true,
        },
      });

      return newCustomer;
    });

    return { customer, portalPassword: plainPassword, username };
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

  static async resetPortalPassword(id: string): Promise<{ email: string; username: string | null; portalPassword: string }> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new Error('Customer not found');

    const plainPassword = generateInitialPassword();
    const hashedPassword = await hashPassword(plainPassword);

    const existingUser = await prisma.user.findFirst({
      where: { customerId: id, role: Role.CUSTOMER },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword, isActive: true },
      });
      return { email: existingUser.email, username: existingUser.username, portalPassword: plainPassword };
    }

    // Create user if it doesn't exist yet
    const username = await buildUniqueUsername(customer.name);
    await prisma.user.create({
      data: {
        email: customer.email!,
        username,
        password: hashedPassword,
        firstName: customer.name,
        role: Role.CUSTOMER,
        customerId: customer.id,
        isActive: true,
      },
    });

    return { email: customer.email!, username, portalPassword: plainPassword };
  }
}
