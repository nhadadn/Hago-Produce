import prisma from '@/lib/db';
import { ChatLanguage, ChatServiceContext, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { InvoiceStatus } from '@prisma/client';

export async function customerBalanceIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const customerId: string | undefined = params.customerId || context?.customerId || undefined;

  const where: any = {
    status: {
      in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE],
    },
  };

  if (customerId) {
    where.customerId = customerId;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: true,
    },
  });

  const totalOutstanding = invoices.reduce((acc, inv) => acc + Number(inv.total), 0);

  const byCustomer = new Map<string, { customerId: string; customerName: string; total: number; count: number }>();

  for (const inv of invoices) {
    const existing = byCustomer.get(inv.customerId) || {
      customerId: inv.customerId,
      customerName: inv.customer.name,
      total: 0,
      count: 0,
    };
    existing.total += Number(inv.total);
    existing.count += 1;
    byCustomer.set(inv.customerId, existing);
  }

  const items = Array.from(byCustomer.values());

  const sources: ChatSource[] = invoices.map((inv) => ({
    type: 'invoice',
    id: inv.id,
    label: inv.number,
  }));

  return {
    intent: 'customer_balance',
    confidence,
    language,
    data: {
      type: 'customer_balance',
      totalOutstanding,
      invoicesCount: invoices.length,
      items,
    },
    sources,
  };
}

