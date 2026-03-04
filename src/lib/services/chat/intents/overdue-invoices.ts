import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { InvoiceStatus } from '@prisma/client';

export async function overdueInvoicesIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  const daysOverdue: number = params.daysOverdue != null ? Number(params.daysOverdue) : 0;
  const customerName = params.customerName as string | null;
  const queryType = params.queryType as 'single_customer' | 'global_report' | undefined;
  
  const now = new Date();
  
  // Base WHERE clause for "Overdue"
  // Definition: Status is PENDING or OVERDUE, and dueDate is in the past.
  const whereBase: any = {
    status: {
      in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE],
    },
    dueDate: {
      lt: now,
    },
  };

  // MUST 1: Apply daysOverdue filter if present (older than X days)
  if (daysOverdue > 0) {
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);
    // Overwrite the 'lt' constraint to be stricter (further in the past)
    whereBase.dueDate.lt = cutoffDate;
  }

  // Helper for Urgency Label (SHOULD 2)
  const getUrgencyLabel = (dOverdue: number, lang: ChatLanguage) => {
    if (dOverdue > 90) return lang === 'en' ? 'Critical' : 'Crítico';
    if (dOverdue > 30) return lang === 'en' ? 'High' : 'Alto';
    return lang === 'en' ? 'Pending' : 'Pendiente';
  };

  // Helper to calculate days overdue
  const calculateDaysOverdue = (dueDate: Date) => {
    const diffMs = now.getTime() - dueDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  // ---------------------------------------------------------
  // MODE 1: SINGLE CUSTOMER
  // ---------------------------------------------------------
  if (customerName || queryType === 'single_customer') {
    if (!customerName) {
        // Fallback if queryType says single but name is missing -> Global
        return executeGlobalReport(whereBase, daysOverdue, language, confidence, now, getUrgencyLabel, calculateDaysOverdue);
    }

    // 1. Find customer
    const customers = await prisma.customer.findMany({
      where: {
        name: {
          contains: customerName,
          mode: 'insensitive',
        },
        isActive: true,
      },
      take: 3,
      select: { id: true, name: true },
    });

    // Case: No customer found -> Suggestions (SHOULD 1)
    if (customers.length === 0) {
      return {
        intent: 'overdue_invoices',
        confidence,
        language,
        data: {
          type: 'overdue_invoices',
          found: false,
          message: language === 'en' 
            ? `Customer "${customerName}" not found.` 
            : `Cliente "${customerName}" no encontrado.`,
        },
      };
    }

    // Case: Ambiguous (multiple results) -> Ask user to clarify
    // (Simpler implementation: just pick first if exact match, or list them? 
    // The requirement says "Si no encuentra -> sugerencias". It implies if it finds multiple, 
    // we might need to handle it. For now, if we find > 1 but one is very close, we could pick it.
    // But safe approach: if > 1, show suggestions. If = 1, proceed.)
    if (customers.length > 1) {
        // Check for exact match
        const exact = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        if (!exact) {
             return {
                intent: 'overdue_invoices',
                confidence,
                language,
                data: {
                  type: 'overdue_invoices',
                  found: false,
                  multiple: true,
                  suggestions: customers.map(c => c.name),
                },
              };
        }
        // If exact match found, use it (fall through)
        customers[0] = exact;
        customers.length = 1; 
    }

    const customer = customers[0];

    // 2. Query invoices for this customer
    const invoices = await prisma.invoice.findMany({
      where: {
        ...whereBase,
        customerId: customer.id,
      },
      orderBy: {
        dueDate: 'asc', // Oldest first = Most Urgent
      },
      take: 10,
      select: {
        id: true,
        number: true,
        dueDate: true,
        total: true,
        status: true,
        customer: {
          select: { name: true },
        },
      },
    });

    // 3. Map response
    let totalOverdue = 0;
    const mappedItems = invoices.map(inv => {
      const dOverdue = calculateDaysOverdue(inv.dueDate);
      const amount = Number(inv.total);
      totalOverdue += amount;
      
      return {
        id: inv.id,
        invoiceNumber: inv.number,
        dueDate: inv.dueDate.toISOString(),
        daysOverdue: dOverdue,
        total: amount,
        currency: 'CAD',
        status: inv.status,
        customerName: inv.customer.name,
        urgencyLabel: getUrgencyLabel(dOverdue, language),
      };
    });

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
        mode: 'single_customer',
        customerName: customer.name,
        totalOverdue, // Sum of displayed items
        invoicesCount: invoices.length,
        oldestDueDate: invoices.length > 0 ? invoices[0].dueDate.toISOString() : null,
        items: mappedItems,
        currency: 'CAD',
        daysOverdue: daysOverdue || undefined,
        grandTotalOverdue: totalOverdue,
      },
      sources,
    };
  }

  // ---------------------------------------------------------
  // MODE 2: GLOBAL REPORT (Default)
  // ---------------------------------------------------------
  return executeGlobalReport(whereBase, daysOverdue, language, confidence, now, getUrgencyLabel, calculateDaysOverdue);
}

async function executeGlobalReport(
    whereBase: any, 
    daysOverdue: number, 
    language: ChatLanguage, 
    confidence: number,
    now: Date,
    getUrgencyLabel: (d: number, l: ChatLanguage) => string,
    calculateDaysOverdue: (d: Date) => number
): Promise<QueryExecutionResult> {

    // 1. Group By Customer (Native Prisma)
    const groups = await prisma.invoice.groupBy({
        by: ['customerId'],
        where: whereBase,
        _sum: {
            total: true,
        },
        _count: {
            id: true,
        },
        _min: {
            dueDate: true,
        },
        orderBy: {
            _sum: {
                total: 'desc',
            },
        },
        take: 10,
    });

    if (groups.length === 0) {
        return {
            intent: 'overdue_invoices',
            confidence,
            language,
            data: {
                type: 'overdue_invoices',
                mode: 'global_report',
                items: [],
                grandTotalOverdue: 0,
                daysOverdue: daysOverdue || undefined,
            },
        };
    }

    // 2. Fetch Customer Names (Strategy A: Merge)
    const customerIds = groups.map(g => g.customerId);
    const customers = await prisma.customer.findMany({
        where: {
            id: { in: customerIds },
        },
        select: {
            id: true,
            name: true,
        },
    });

    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    // 3. Map Response
    let grandTotalOverdue = 0;
    const items = groups.map(g => {
        const total = Number(g._sum.total || 0);
        grandTotalOverdue += total;
        const oldestDate = g._min.dueDate ? new Date(g._min.dueDate) : now;
        const dOverdue = calculateDaysOverdue(oldestDate);

        return {
            customerId: g.customerId,
            customerName: customerMap.get(g.customerId) || 'Unknown',
            totalOverdue: total,
            invoicesCount: g._count.id,
            oldestDueDate: g._min.dueDate ? g._min.dueDate.toISOString() : null,
            currency: 'CAD',
            urgencyLabel: getUrgencyLabel(dOverdue, language),
        };
    });

    return {
        intent: 'overdue_invoices',
        confidence,
        language,
        data: {
            type: 'overdue_invoices',
            mode: 'global_report',
            items,
            grandTotalOverdue,
            daysOverdue: daysOverdue || undefined,
            currency: 'CAD',
        },
        // Global report doesn't link specific invoice sources usually, 
        // but could link to customer balance page? Leaving empty for now as requested format didn't specify sources.
        sources: [], 
    };
}
