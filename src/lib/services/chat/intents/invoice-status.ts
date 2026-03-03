import prisma from '@/lib/db';
import { ChatLanguage, QueryExecutionResult } from '@/lib/chat/types';
import { Invoice, InvoiceStatus } from '@prisma/client';

// Helper: Traducción de estados
const STATUS_LABELS: Record<string, Record<ChatLanguage, string>> = {
  DRAFT: { es: 'Borrador', en: 'Draft' },
  SENT: { es: 'Enviada', en: 'Sent' },
  PENDING: { es: 'Pendiente', en: 'Pending' },
  PAID: { es: 'Pagada', en: 'Paid' },
  CANCELLED: { es: 'Cancelada', en: 'Cancelled' },
  OVERDUE: { es: 'Vencida', en: 'Overdue' },
};

// Helper: Prioridad de estados para ordenamiento (SHOULD 1)
const STATUS_PRIORITY: Record<string, number> = {
  OVERDUE: 0,
  PENDING: 1,
  SENT: 2,
  PAID: 3,
  DRAFT: 4,
  CANCELLED: 5,
};

interface FormattedInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  statusLabel: string;
  total: number;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  customerName: string;
  isOverdue: boolean;
}

interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  overdueCount: number;
  currency: string;
}

function formatInvoice(invoice: Invoice & { customer: { name: string } }, language: ChatLanguage): FormattedInvoice {
  const isOverdue = invoice.status === 'OVERDUE' || 
    (invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && new Date(invoice.dueDate) < new Date());

  // Si calculamos que está vencida pero el estado en DB no es OVERDUE, 
  // podríamos forzar la etiqueta visualmente, pero mantendremos el status original de DB 
  // y usaremos el flag isOverdue para UI.
  // Nota: Si se prefiere, se puede ajustar el statusLabel dinámicamente.
  
  const statusKey = invoice.status as string;
  const label = STATUS_LABELS[statusKey]?.[language] || statusKey;

  return {
    id: invoice.id,
    invoiceNumber: invoice.number,
    status: invoice.status,
    statusLabel: label,
    total: Number(invoice.total),
    currency: 'CAD', // MUST 2: Hardcoded
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
    customerName: invoice.customer.name,
    isOverdue,
  };
}

export async function invoiceStatusIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  const invoiceNumber = params.invoiceNumber ? String(params.invoiceNumber).trim() : null;
  const customerName = params.customerName ? String(params.customerName).trim() : null;
  const isLast = params.isLast === true || String(params.isLast).toLowerCase() === 'true';

  // MODO 0: Sin parámetros válidos
  if (!invoiceNumber && !customerName) {
    return {
      intent: 'invoice_status',
      confidence,
      language,
      data: {
        type: 'invoice_status_error',
        message: language === 'es' 
          ? 'Por favor proporciona un número de factura o nombre de cliente.' 
          : 'Please provide an invoice number or customer name.',
      },
      sources: [],
    };
  }

  // MODO 1: Búsqueda por número (invoiceNumber)
  if (invoiceNumber) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { number: { equals: invoiceNumber, mode: 'insensitive' } }, // Exacto (case insensitive)
          { number: { contains: invoiceNumber, mode: 'insensitive' } }, // Parcial
        ],
      },
      include: { customer: true },
      orderBy: { issueDate: 'desc' }, // MUST 3
    });

    if (!invoice) {
      return {
        intent: 'invoice_status',
        confidence,
        language,
        data: {
          type: 'invoice_status_not_found',
          searchTerm: invoiceNumber,
        },
        sources: [],
      };
    }

    const formatted = formatInvoice(invoice, language);
    return {
      intent: 'invoice_status',
      confidence,
      language,
      data: {
        type: 'invoice_detail',
        invoice: formatted,
      },
      sources: [
        { type: 'invoice', id: invoice.id, label: invoice.number },
        { type: 'customer', id: invoice.customerId, label: invoice.customer.name }
      ],
    };
  }

  // MODO 2: Última factura del cliente
  if (customerName && isLast) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        customer: {
          name: { contains: customerName, mode: 'insensitive' },
        },
      },
      include: { customer: true },
      orderBy: { issueDate: 'desc' }, // MUST 3
    });

    if (!invoice) {
      // SHOULD 2: Sugerencias
      const suggestions = await getCustomerSuggestions(customerName);
      return {
        intent: 'invoice_status',
        confidence,
        language,
        data: {
          type: 'invoice_status_not_found',
          searchTerm: customerName,
          suggestions,
        },
        sources: [],
      };
    }

    const formatted = formatInvoice(invoice, language);
    return {
      intent: 'invoice_status',
      confidence,
      language,
      data: {
        type: 'invoice_detail',
        invoice: formatted,
        isLast: true,
      },
      sources: [
        { type: 'invoice', id: invoice.id, label: invoice.number },
        { type: 'customer', id: invoice.customerId, label: invoice.customer.name }
      ],
    };
  }

  // MODO 3: Lista de facturas del cliente
  if (customerName && !isLast) {
    const invoices = await prisma.invoice.findMany({
      where: {
        customer: {
          name: { contains: customerName, mode: 'insensitive' },
        },
      },
      include: { customer: true },
      orderBy: { issueDate: 'desc' }, // MUST 3
      take: 5,
    });

    if (invoices.length === 0) {
      // SHOULD 2: Sugerencias
      const suggestions = await getCustomerSuggestions(customerName);
      return {
        intent: 'invoice_status',
        confidence,
        language,
        data: {
          type: 'invoice_status_not_found',
          searchTerm: customerName,
          suggestions,
        },
        sources: [],
      };
    }

    // Formateo inicial
    let formattedInvoices = invoices.map(inv => formatInvoice(inv, language));

    // SHOULD 1: Priorización por estado activo (Sort en memoria)
    formattedInvoices.sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] ?? 99;
      const priorityB = STATUS_PRIORITY[b.status] ?? 99;
      return priorityA - priorityB;
    });

    // SHOULD 3: Resumen de deuda en memoria
    const summary: InvoiceSummary = {
      totalInvoices: formattedInvoices.length,
      totalAmount: formattedInvoices.reduce((sum, inv) => sum + inv.total, 0),
      overdueCount: formattedInvoices.filter(inv => inv.isOverdue).length,
      currency: 'CAD',
    };

    const sources = formattedInvoices.map(inv => ({
      type: 'invoice' as const,
      id: inv.id,
      label: inv.invoiceNumber,
    }));
    
    // Agregar cliente como source si hay resultados (usamos el primero)
    if (invoices[0]) {
      sources.push({
        type: 'customer',
        id: invoices[0].customerId,
        label: invoices[0].customer.name
      });
    }

    return {
      intent: 'invoice_status',
      confidence,
      language,
      data: {
        type: 'invoice_list',
        invoices: formattedInvoices,
        summary,
        customerName: invoices[0]?.customer.name || customerName,
      },
      sources,
    };
  }

  // Fallback por seguridad (no debería alcanzarse dada la lógica de arriba)
  return {
    intent: 'invoice_status',
    confidence,
    language,
    data: { type: 'invoice_status_error' },
    sources: [],
  };
}

// Helper para SHOULD 2
async function getCustomerSuggestions(term: string): Promise<string[]> {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        name: { contains: term, mode: 'insensitive' },
      },
      select: { name: true },
      take: 3,
    });
    return customers.map(c => c.name);
  } catch (error) {
    return [];
  }
}
