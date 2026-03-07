
import prisma from '@/lib/db';
import { ChatLanguage, ChatServiceContext, QueryExecutionResult } from '@/lib/chat/types';
import { InvoiceStatus } from '@prisma/client';

interface BalanceItem {
  customerId: string;
  customerName: string;
  total: number;
  count: number;
  currency: 'CAD';
  breakdown?: {
    overdueAmount: number;
    pendingAmount: number;
    oldestUnpaidDate: string | null;
  };
  statusMessage?: string;
}

export async function customerBalanceIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const customerName = params.customerName;
  const queryType = params.queryType;

  // MUST 1 (Precisión 1): Modo 0 - Return early si no hay parámetros válidos
  if (!queryType && !customerName) {
    return {
      intent: 'customer_balance',
      confidence,
      language,
      sources: [],
      data: {
        type: 'text',
        message: language === 'en'
          ? 'Please specify a customer name or ask for a global summary.'
          : 'Por favor especifica un nombre de cliente o pide un resumen global.',
      }
    };
  }

  // MODO 1: Single Customer
  if (queryType === 'single_customer' || customerName) {
    // 1. Buscar cliente (SHOULD 1: Sugerencias si no encuentra)
    const customer = await prisma.customer.findFirst({
      where: {
        name: {
          contains: customerName,
          mode: 'insensitive',
        },
      },
    });

    if (!customer) {
      // SHOULD 1: Sugerencias
      const suggestions = await prisma.customer.findMany({
        where: {
          name: {
            contains: customerName,
            mode: 'insensitive',
          },
        },
        take: 3,
        select: { name: true },
      });

      return {
        intent: 'customer_balance',
        confidence,
        language,
        sources: [],
        data: {
          type: 'customer_suggestions',
          suggestions: suggestions.map(s => s.name),
          originalTerm: customerName,
        }
      };
    }

    // MUST 2 & PRECISIÓN 2: groupBy por status para desglose
    const balanceByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        customerId: customer.id,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
      },
      _sum: { total: true },
      _count: { _all: true },
      _min: { issueDate: true },
    });

    let overdueAmount = 0;
    let pendingAmount = 0;
    let totalCount = 0;
    let dates: Date[] = [];

    for (const group of balanceByStatus) {
      const amount = Number(group._sum.total || 0);
      const count = group._count._all;
      
      if (group.status === InvoiceStatus.OVERDUE) {
        overdueAmount += amount;
      } else if (group.status === InvoiceStatus.PENDING) {
        pendingAmount += amount;
      }
      
      totalCount += count;
      if (group._min.issueDate) {
        dates.push(group._min.issueDate);
      }
    }

    const totalOutstanding = overdueAmount + pendingAmount;
    
    // SHOULD 2: oldestUnpaidDate
    let oldestUnpaidDate: string | null = null;
    if (dates.length > 0) {
      // Sort dates just in case and pick the oldest
      dates.sort((a, b) => a.getTime() - b.getTime());
      oldestUnpaidDate = dates[0].toISOString();
    }

    // SHOULD 3: statusMessage
    let statusMessage = '';
    if (overdueAmount > 0) {
      statusMessage = language === 'en' 
        ? `Has overdue amount of $${overdueAmount.toFixed(2)}` 
        : `Tiene un monto vencido de $${overdueAmount.toFixed(2)}`;
      
      if (oldestUnpaidDate) {
        const oldest = new Date(oldestUnpaidDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - oldest.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays > 30) {
           statusMessage += language === 'en' ? ' (Critical)' : ' (Crítico)';
        }
      }
    } else {
      statusMessage = language === 'en' ? 'No overdue invoices' : 'Sin facturas vencidas';
    }

    const item: BalanceItem = {
      customerId: customer.id,
      customerName: customer.name,
      total: Number(totalOutstanding || 0),
      count: Number(totalCount || 0),
      currency: 'CAD',
      breakdown: {
        overdueAmount: Number(overdueAmount || 0),
        pendingAmount: Number(pendingAmount || 0),
        oldestUnpaidDate
      },
      statusMessage
    };

    return {
      intent: 'customer_balance',
      confidence,
      language,
      data: {
        type: 'customer_balance',
        totalOutstanding: Number(totalOutstanding || 0), // Mantener para compatibilidad
        invoicesCount: Number(totalCount || 0), // Mantener para compatibilidad
        items: [item],
        mode: 'single_customer'
      }
    };
  }

  // MODO 2: Global Summary
  // MUST 2: Agregación eficiente (Top 10 deudores)
  const grouped = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: {
      status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
    },
    _sum: { total: true },
    _count: { _all: true },
    orderBy: {
      _sum: { total: 'desc' },
    },
    take: 10,
  });

  if (grouped.length === 0) {
    return {
      intent: 'customer_balance',
      confidence,
      language,
      data: {
        type: 'customer_balance',
        totalOutstanding: 0,
        invoicesCount: 0,
        items: [],
        mode: 'global_summary'
      }
    };
  }

  // Estrategia A: Hydrate customer names
  const customerIds = grouped.map(g => g.customerId);
  const customers = await prisma.customer.findMany({
    where: {
      id: { in: customerIds },
    },
    select: { id: true, name: true },
  });

  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  const items: BalanceItem[] = grouped.map(g => ({
    customerId: g.customerId,
    customerName: customerMap.get(g.customerId) || 'Unknown Customer',
    total: Number(g._sum.total || 0),
    count: Number(g._count._all || 0),
    currency: 'CAD',
  }));

  const globalTotal = items.reduce((acc, item) => acc + Number(item.total || 0), 0);
  const globalCount = items.reduce((acc, item) => acc + Number(item.count || 0), 0);

  return {
    intent: 'customer_balance',
    confidence,
    language,
    data: {
      type: 'customer_balance',
      totalOutstanding: Number(globalTotal || 0),
      invoicesCount: Number(globalCount || 0),
      items,
      mode: 'global_summary'
    }
  };
}
