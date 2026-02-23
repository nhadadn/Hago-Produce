import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';

export async function invoiceStatusIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  const invoiceNumber: string | undefined = params.invoiceNumber;
  const searchTerm: string = String(params.searchTerm || '').trim();

  if (!invoiceNumber && !searchTerm) {
    return {
      intent: 'invoice_status',
      confidence,
      language,
      data: { type: 'invoice_status', invoiceNumber: null, invoice: null },
      sources: [],
    };
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        invoiceNumber ? { number: invoiceNumber } : undefined,
        searchTerm ? { number: { contains: searchTerm, mode: 'insensitive' } } : undefined,
      ].filter(Boolean) as any,
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
    return {
      intent: 'invoice_status',
      confidence,
      language,
      data: {
        type: 'invoice_status',
        invoiceNumber: invoiceNumber || searchTerm,
        invoice: null,
      },
      sources: [],
    };
  }

  const sources: ChatSource[] = [
    {
      type: 'invoice',
      id: invoice.id,
      label: invoice.number,
    },
    {
      type: 'customer',
      id: invoice.customerId,
      label: invoice.customer.name,
    },
  ];

  return {
    intent: 'invoice_status',
    confidence,
    language,
    data: {
      type: 'invoice_status',
      invoiceNumber: invoice.number,
      invoice: {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        total: Number(invoice.total),
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        customer: {
          id: invoice.customer.id,
          name: invoice.customer.name,
        },
      },
    },
    sources,
  };
}

