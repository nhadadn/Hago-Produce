import prisma from '@/lib/db';
import { ChatLanguage, ChatServiceContext, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { InvoicesService } from '@/lib/services/invoices.service';
import { CreateInvoiceInput } from '@/lib/validation/invoices';
import { InvoiceStatus } from '@prisma/client';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ExtractedInvoiceItem {
  productName: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
}

interface ExtractedInvoiceParams {
  customerName: string;
  items: ExtractedInvoiceItem[];
  notes?: string;
  dueDate?: string;
  taxRate?: number;
}

interface PendingInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  description?: string;
  totalPrice: number;
}

interface PendingInvoice {
  customerId: string;
  customerName: string;
  items: PendingInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  dueDate: string;
  notes?: string;
}

function buildExtractFunctionDefinition(language: ChatLanguage) {
  const description =
    language === 'en'
      ? 'Extracts invoice parameters from the user message'
      : 'Extrae los parámetros de una factura desde el mensaje del usuario';

  return {
    name: 'extract_invoice_parameters',
    description,
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_name: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' },
              description: { type: 'string' },
            },
            required: ['product_name', 'quantity'],
          },
        },
        notes: { type: 'string' },
        due_date: { type: 'string', description: 'ISO date string YYYY-MM-DD' },
        tax_rate: { type: 'number' },
      },
      required: ['customer_name', 'items'],
    },
  };
}

async function extractInvoiceParams(
  message: string,
  language: ChatLanguage,
  apiKey?: string,
): Promise<ExtractedInvoiceParams | null> {
  const key = apiKey || process.env.OPENAI_API_KEY;
  const trimmed = message.trim();

  if (!trimmed || !key) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const tools = [
      {
        type: 'function',
        function: buildExtractFunctionDefinition(language),
      },
    ];

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              language === 'en'
                ? 'Extract structured invoice parameters for HAGO PRODUCE ERP.'
                : 'Extrae parámetros estructurados de factura para el ERP de HAGO PRODUCE.',
          },
          { role: 'user', content: trimmed },
        ],
        tools,
        tool_choice: {
          type: 'function',
          function: 'extract_invoice_parameters',
        },
        temperature: 0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.type !== 'function' || !toolCall.function?.arguments) {
      return null;
    }

    const args = JSON.parse(toolCall.function.arguments);
    const customerName = String(args.customer_name || '').trim();
    const itemsInput = Array.isArray(args.items) ? args.items : [];

    if (!customerName || !itemsInput.length) {
      return null;
    }

    const items: ExtractedInvoiceItem[] = itemsInput
      .map((it: any) => ({
        productName: String(it.product_name || '').trim(),
        quantity: Number(it.quantity),
        unitPrice: it.unit_price ? Number(it.unit_price) : undefined,
        description: it.description ? String(it.description) : undefined,
      }))
      .filter((it: any) => it.productName && it.quantity > 0);

    return {
      customerName,
      items,
      notes: args.notes,
      dueDate: args.due_date,
      taxRate: args.tax_rate,
    };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createInvoiceIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const rawMessage = String(params.rawMessage || params.searchTerm || params.message || '').trim();
  const extracted = await extractInvoiceParams(rawMessage, language);

  if (!extracted) {
    return {
      intent: 'create_invoice',
      confidence,
      language,
      data: {
        type: 'create_invoice',
        created: false,
        reason: 'extraction_failed',
      },
      sources: [],
    };
  }

  // Find Customer
  const customerMatches = await prisma.customer.findMany({
    where: {
      name: { contains: extracted.customerName, mode: 'insensitive' },
    },
    take: 5,
  });

  if (!customerMatches.length) {
    return {
      intent: 'create_invoice',
      confidence,
      language,
      data: {
        type: 'create_invoice',
        created: false,
        reason: 'customer_not_found',
        customers: [],
      },
      sources: [],
    };
  }

  if (customerMatches.length > 1) {
    return {
      intent: 'create_invoice',
      confidence,
      language,
      data: {
        type: 'create_invoice',
        created: false,
        reason: 'multiple_customers',
        customers: customerMatches.map((c) => ({ id: c.id, name: c.name })),
      },
      sources: [],
    };
  }

  const customer = customerMatches[0];
  const pendingItems: PendingInvoiceItem[] = [];
  const sources: ChatSource[] = [];

  // Find Products
  for (const item of extracted.items) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: item.productName, mode: 'insensitive' } },
          { nameEs: { contains: item.productName, mode: 'insensitive' } },
        ],
      },
      include: {
        prices: { where: { isCurrent: true } },
      },
      take: 1,
    });

    if (!products.length) {
      return {
        intent: 'create_invoice',
        confidence,
        language,
        data: {
          type: 'create_invoice',
          created: false,
          reason: 'product_not_found',
          productName: item.productName,
        },
        sources: [],
      };
    }

    const product = products[0];
    
    // Find the best matching price
    const currentPrice = product.prices.find((p) => p.isCurrent) || product.prices[0];
    
    // Determine unit price: 
    // 1. User specified price in message
    // 2. Current sell price from DB
    // 3. Current cost price from DB (fallback)
    // 4. Zero (final fallback)
    let unitPrice = 0;
    
    if (item.unitPrice !== undefined) {
      unitPrice = item.unitPrice;
    } else if (currentPrice) {
      if (currentPrice.sellPrice) {
        unitPrice = currentPrice.sellPrice.toNumber();
      } else {
        unitPrice = currentPrice.costPrice.toNumber();
      }
    }

    pendingItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      description: item.description || product.name,
      totalPrice: item.quantity * unitPrice,
    });

    sources.push({
      label: product.name,
      type: 'product',
      id: product.id,
    });
  }

  // Calculate Totals
  const subtotal = pendingItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = extracted.taxRate ?? 0.13;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const pendingInvoice: PendingInvoice = {
    customerId: customer.id,
    customerName: customer.name,
    items: pendingItems,
    subtotal,
    taxRate,
    taxAmount,
    total,
    dueDate: extracted.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: extracted.notes,
  };

  return {
    intent: 'create_invoice',
    confidence,
    language,
    data: {
      type: 'create_invoice',
      created: false,
      reason: 'confirmation_required',
      pendingInvoice,
    },
    sources,
  };
}

export async function confirmInvoiceIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const pendingInvoice = context?.pendingInvoice as PendingInvoice | undefined;

  if (!pendingInvoice) {
    return {
      intent: 'confirm_invoice',
      confidence,
      language,
      data: {
        type: 'confirm_invoice',
        success: false,
        reason: 'no_pending_invoice',
      },
      sources: [],
    };
  }

  try {
    const invoicesService = new InvoicesService();
    const invoiceInput: CreateInvoiceInput = {
      customerId: pendingInvoice.customerId,
      issueDate: new Date(),
      dueDate: new Date(pendingInvoice.dueDate),
      status: InvoiceStatus.SENT,
      notes: pendingInvoice.notes,
      taxRate: pendingInvoice.taxRate,
      items: pendingInvoice.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        description: item.description,
      })),
    };

    const invoice = await invoicesService.create(invoiceInput, context?.userId);

    return {
      intent: 'confirm_invoice',
      confidence,
      language,
      data: {
        type: 'confirm_invoice',
        success: true,
        invoice: {
          id: invoice.id,
          number: invoice.number,
          total: invoice.total.toNumber(),
        },
      },
      sources: [],
    };
  } catch (error) {
    return {
      intent: 'confirm_invoice',
      confidence,
      language,
      data: {
        type: 'confirm_invoice',
        success: false,
        reason: 'creation_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      sources: [],
    };
  }
}

export async function cancelInvoiceIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  return {
    intent: 'cancel_invoice',
    confidence,
    language,
    data: {
      type: 'cancel_invoice',
      success: true,
    },
    sources: [],
  };
}
