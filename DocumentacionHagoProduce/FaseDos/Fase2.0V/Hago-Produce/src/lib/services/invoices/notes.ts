import prisma from '@/lib/db';
import { InvoiceNoteCreateInput } from '@/lib/validation/invoice-notes';

export interface InvoiceNoteWithUser {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export class InvoiceNotesService {
  async listByInvoice(invoiceId: string): Promise<InvoiceNoteWithUser[]> {
    const notes = await prisma.invoiceNote.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return notes;
  }

  async create(
    invoiceId: string,
    userId: string,
    data: InvoiceNoteCreateInput,
  ): Promise<InvoiceNoteWithUser> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const note = await prisma.invoiceNote.create({
      data: {
        invoiceId,
        userId,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return note;
  }
}

export const invoiceNotesService = new InvoiceNotesService();

