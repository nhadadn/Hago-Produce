import prisma from '@/lib/db';
import { CreateInvoiceInput, InvoiceFilters, UpdateInvoiceInput } from '@/lib/validation/invoices';
import { InvoiceStatus, Prisma } from '@prisma/client';

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

  async create(data: CreateInvoiceInput) {
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

    return await prisma.$transaction(async (tx) => {
      const number = await this.generateInvoiceNumber(tx);

      const invoice = await tx.invoice.create({
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
        include: {
          items: true,
          customer: true
        }
      });

      return invoice;
    });
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

  async update(id: string, data: UpdateInvoiceInput) {
    const existing = await this.findOne(id);

    if (!existing) throw new Error('Invoice not found');
    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be updated');
    }

    const { items, ...invoiceData } = data;

    return await prisma.$transaction(async (tx) => {
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

        const invoice = await tx.invoice.update({
            where: { id },
            data: {
                ...invoiceData,
                subtotal,
                taxRate,
                taxAmount,
                total,
            },
            include: {
                items: true,
                customer: true
            }
        });

        return invoice;
    });
  }
}

export const invoicesService = new InvoicesService();
