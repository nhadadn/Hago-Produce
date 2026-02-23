import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { InvoiceStatus } from '@prisma/client';

export async function overdueInvoicesIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  const daysOverdue: number = params.daysOverdue != null ? Number(params.daysOverdue) : 0;

  const now = new Date();
  const cutoff = new Date(now);
  if (daysOverdue > 0) {
    cutoff.setDate(cutoff.getDate() - daysOverdue);
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE],
      },
      dueDate: {
        lt: now,
      },
    },
    include: {
      customer: true,
    },
  });

  const byCustomer = new Map<
    string,
    {
      customerId: string;
      customerName: string;
      total: number;
      count: number;
      invoices: {
        id: string;
        number: string;
        dueDate: string;
        daysOverdue: number;
        total: number;
      }[];
    }
  >();

  for (const inv of invoices) {
    const overdueMs = now.getTime() - inv.dueDate.getTime();
    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
    if (daysOverdue > 0 && overdueDays < daysOverdue) {
      continue;
    }

    const existing =
      byCustomer.get(inv.customerId) || ({
        customerId: inv.customerId,
        customerName: inv.customer.name,
        total: 0,
        count: 0,
        invoices: [],
      } as any);

    const total = Number(inv.total);
    existing.total += total;
    existing.count += 1;
    existing.invoices.push({
      id: inv.id,
      number: inv.number,
      dueDate: inv.dueDate.toISOString(),
      daysOverdue: overdueDays,
      total,
    });

    byCustomer.set(inv.customerId, existing);
  }

  const items = Array.from(byCustomer.values());

  const sources: ChatSource[] = invoices.map((inv) => ({
    type: 'invoice',
    id: inv.id,
    label: inv.number,
  }));

  return {
    intent: 'overdue_invoices',
    confidence,
    language,
    data: {
      type: 'overdue_invoices',
      daysOverdue: daysOverdue || undefined,
      items,
    },
    sources,
  };
}

