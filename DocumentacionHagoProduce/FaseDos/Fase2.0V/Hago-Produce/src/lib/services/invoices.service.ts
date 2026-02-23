import prisma from '@/lib/db';
import { CreateInvoiceInput, InvoiceFilters, UpdateInvoiceInput } from '@/lib/validation/invoices';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { logInvoiceCreate, logInvoiceStatusChange, logInvoiceUpdate } from '@/lib/audit/invoices';

export class InvoicesService {
  
  private async generateInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await tx.invoice.findFirst({
      where: {
        number: {
          startsWith: `INV-${year}-`
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.number.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2]);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    return `INV-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  async create(data: CreateInvoiceInput, userId?: string) {
    const { items, ...invoiceData } = data;

    // Calculate totals
    let subtotal = 0;
    const calculatedItems = items.map(item => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        ...item,
        totalPrice: total
      };
    });

    const taxRate = invoiceData.taxRate || 0.13;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await this.generateInvoiceNumber(tx);

      const created = await tx.invoice.create({
        data: {
          ...invoiceData,
          number,
          subtotal,
          taxRate,
          taxAmount,
          total,
          items: {
            create: calculatedItems
          }
        },
      });

      return created;
    });

    await logInvoiceCreate(userId, {
      id: invoice.id,
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
    });

    return invoice;
  }

  private getAllowedNextStatuses(status: InvoiceStatus): InvoiceStatus[] {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return [InvoiceStatus.SENT, InvoiceStatus.PAID];
      case InvoiceStatus.SENT:
        return [InvoiceStatus.PAID, InvoiceStatus.OVERDUE];
      case InvoiceStatus.OVERDUE:
        return [InvoiceStatus.PAID];
      default:
        return [];
    }
  }

  private isValidStatusTransition(current: InvoiceStatus, next: InvoiceStatus): boolean {
    if (current === next) return false;
    return this.getAllowedNextStatuses(current).includes(next);
  }

  async findAll(filters: InvoiceFilters) {
    const { page = 1, limit = 10, search, status, customerId, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(startDate && endDate && {
        issueDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true }
            }
          }
        },
        customer: true
      }
    });

    return invoice;
  }

  async update(id: string, data: UpdateInvoiceInput, userId?: string) {
    const existing = await this.findOne(id);

    if (!existing) throw new Error('Invoice not found');
    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be updated');
    }

    const { items, ...invoiceData } = data;

    const beforeSnapshot = {
      id: existing.id,
      status: existing.status,
      subtotal: existing.subtotal,
      taxRate: existing.taxRate,
      taxAmount: existing.taxAmount,
      total: existing.total,
    };

    const invoice = await prisma.$transaction(async (tx) => {
        let subtotal = Number(existing.subtotal);
        
        // If items are provided, replace them and recalculate subtotal
        if (items) {
             subtotal = 0;
             const calculatedItems = items.map(item => {
                const total = item.quantity * item.unitPrice;
                subtotal += total;
                return {
                    ...item,
                    totalPrice: total
                };
             });
             
             // Delete existing items
             await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
             
             // Create new items
             await tx.invoiceItem.createMany({
                 data: calculatedItems.map(item => ({
                     ...item,
                     invoiceId: id
                 }))
             });
        }

        const taxRate = invoiceData.taxRate !== undefined ? invoiceData.taxRate : Number(existing.taxRate);
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;

        const updated = await tx.invoice.update({
            where: { id },
            data: {
                ...invoiceData,
                subtotal,
                taxRate,
                taxAmount,
                total,
            },
        });
        return updated;
    });

    await logInvoiceUpdate(userId, beforeSnapshot, {
      id: invoice.id,
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
    });

    return invoice;
  }

  async changeStatus(id: string, newStatus: InvoiceStatus, userId?: string) {
    const existing = await prisma.invoice.findUnique({ where: { id } });

    if (!existing) throw new Error('Invoice not found');

    if (!this.isValidStatusTransition(existing.status as InvoiceStatus, newStatus)) {
      throw new Error('Invalid status transition');
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: newStatus },
    });

    await logInvoiceStatusChange(
      userId,
      updated.id,
      existing.status as InvoiceStatus,
      updated.status as InvoiceStatus,
    );

    return updated;
  }
}

export const invoicesService = new InvoicesService();
