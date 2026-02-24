import prisma from '@/lib/db';
import { ChatLanguage, ChatServiceContext, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { InvoicesService } from '@/lib/services/invoices.service';
import { generateInvoicePDF } from '@/lib/services/reports/export';
import { sendInvoiceEmail } from '@/lib/services/email.service';
import { createNotificationLog } from '@/lib/services/notifications/notification-log.service';
import { sendInvoiceDocument } from '@/lib/services/telegram.service';
import { WhatsAppService } from '@/lib/services/bot/whatsapp.service';
import { logAudit } from '@/lib/audit/logger';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

type SendChannel = 'whatsapp' | 'email' | 'telegram' | 'none';

interface ExtractedOrderItem {
  productName: string;
  quantity: number;
  unit: 'kg' | 'lb' | 'unit' | 'box' | 'case';
}

interface ExtractedOrderParams {
  customerName: string;
  items: ExtractedOrderItem[];
  notes?: string;
  sendChannel: SendChannel;
  deliveryDate?: string;
  deliveryTime?: string;
}

interface PendingOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface PendingOrder {
  customerId: string;
  customerName: string;
  items: PendingOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  sendChannel: SendChannel | null;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
}

function buildExtractFunctionDefinition(language: ChatLanguage) {
  const description =
    language === 'en'
      ? 'Extracts order parameters from the user message'
      : 'Extrae los parámetros de un pedido desde el mensaje del usuario';

  return {
    name: 'extract_order_parameters',
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
              unit: {
                type: 'string',
                enum: ['kg', 'lb', 'unit', 'box', 'case'],
              },
            },
            required: ['product_name', 'quantity', 'unit'],
          },
        },
        notes: { type: 'string' },
        send_channel: {
          type: 'string',
          enum: ['whatsapp', 'email', 'telegram', 'none'],
        },
        delivery_date: { type: 'string' },
        delivery_time: { type: 'string' },
      },
      required: ['customer_name', 'items'],
    },
  };
}

function normalizeSendChannel(value: string | undefined | null): SendChannel {
  const v = (value || '').toLowerCase();
  if (v === 'whatsapp' || v === 'email' || v === 'telegram') {
    return v;
  }
  return 'none';
}

function detectSendChannelFromText(text: string): SendChannel {
  const lower = text.toLowerCase();
  if (lower.includes('whatsapp')) return 'whatsapp';
  if (lower.includes('telegram')) return 'telegram';
  if (lower.includes('email') || lower.includes('correo')) return 'email';
  return 'none';
}

function basicRegexFallback(message: string): ExtractedOrderParams | null {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) {
    return null;
  }

  const firstLine = lines[0];
  const customerName = firstLine.replace(/^hola[,\s]*/i, '').slice(0, 80).trim() || 'Cliente';

  const items: ExtractedOrderItem[] = [];
  const itemRegex = /(\d+(?:[.,]\d+)?)\s+(kg|kilos|kilo|lb|lbs|libra|libras|unit|unidad|unidades|box|caja|cajas|case)\s+de\s+([^.,\n]+)/i;

  for (const line of lines) {
    const match = line.match(itemRegex);
    if (match) {
      const quantity = Number(match[1].replace(',', '.'));
      const unitToken = match[2].toLowerCase();
      let unit: ExtractedOrderItem['unit'] = 'unit';
      if (unitToken.startsWith('kg') || unitToken.startsWith('kilo')) unit = 'kg';
      else if (unitToken.startsWith('lb') || unitToken.startsWith('libra')) unit = 'lb';
      else if (unitToken.startsWith('box') || unitToken.startsWith('caja')) unit = 'box';
      else if (unitToken.startsWith('case')) unit = 'case';
      const productName = match[3].trim();
      if (productName && Number.isFinite(quantity) && quantity > 0) {
        items.push({ productName, quantity, unit });
      }
    }
  }

  if (!items.length) {
    return null;
  }

  const sendChannel = detectSendChannelFromText(message);

  return {
    customerName,
    items,
    notes: undefined,
    sendChannel,
  };
}

export async function extractOrderParams(
  message: string,
  language: ChatLanguage,
  apiKey?: string,
): Promise<ExtractedOrderParams | null> {
  const key = apiKey || process.env.OPENAI_API_KEY;
  const trimmed = message.trim();

  if (!trimmed) {
    return null;
  }

  if (!key) {
    return basicRegexFallback(trimmed);
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
                ? 'Extract structured order parameters for HAGO PRODUCE ERP.'
                : 'Extrae parámetros estructurados de pedido para el ERP de HAGO PRODUCE.',
          },
          { role: 'user', content: trimmed },
        ],
        tools,
        tool_choice: {
          type: 'function',
          function: 'extract_order_parameters',
        },
        temperature: 0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return basicRegexFallback(trimmed);
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== 'function' || !toolCall.function?.arguments) {
      return basicRegexFallback(trimmed);
    }

    let args: any;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      return basicRegexFallback(trimmed);
    }

    const customerName = String(args.customer_name || '').trim();
    const itemsInput = Array.isArray(args.items) ? args.items : [];

    if (!customerName || !itemsInput.length) {
      return basicRegexFallback(trimmed);
    }

    const items: ExtractedOrderItem[] = itemsInput
      .map((it: any) => {
        const productName = String(it.product_name || '').trim();
        const quantity = Number(it.quantity);
        const unit = String(it.unit || '').toLowerCase();
        let normalizedUnit: ExtractedOrderItem['unit'] = 'unit';
        if (unit === 'kg') normalizedUnit = 'kg';
        else if (unit === 'lb') normalizedUnit = 'lb';
        else if (unit === 'box') normalizedUnit = 'box';
        else if (unit === 'case') normalizedUnit = 'case';
        if (!productName || !Number.isFinite(quantity) || quantity <= 0) {
          return null;
        }
        return {
          productName,
          quantity,
          unit: normalizedUnit,
        };
      })
      .filter((it: ExtractedOrderItem | null): it is ExtractedOrderItem => Boolean(it));

    if (!items.length) {
      return basicRegexFallback(trimmed);
    }

    const notes = typeof args.notes === 'string' ? args.notes : undefined;
    const sendChannel = normalizeSendChannel(args.send_channel);
    const deliveryDate = typeof args.delivery_date === 'string' ? args.delivery_date : undefined;
    const deliveryTime = typeof args.delivery_time === 'string' ? args.delivery_time : undefined;

    return {
      customerName,
      items,
      notes,
      sendChannel,
      deliveryDate,
      deliveryTime,
    };
  } catch (error) {
    return basicRegexFallback(trimmed);
  } finally {
    clearTimeout(timeout);
  }
}

export async function createOrderIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const rawMessage: string = String(params.rawMessage || params.message || '').trim();

  const extracted = await extractOrderParams(rawMessage, language);

  if (!extracted) {
    return {
      intent: 'create_order',
      confidence,
      language,
      data: {
        type: 'create_order',
        created: false,
        reason: 'extraction_failed',
      },
      sources: [],
    };
  }

  const customerMatches = await prisma.customer.findMany({
    where: {
      name: { contains: extracted.customerName, mode: 'insensitive' },
    },
    take: 5,
  });

  if (!customerMatches.length) {
    return {
      intent: 'create_order',
      confidence,
      language,
      data: {
        type: 'create_order',
        created: false,
        reason: 'customer_not_found',
        customers: [],
      },
      sources: [],
    };
  }

  if (customerMatches.length > 1) {
    return {
      intent: 'create_order',
      confidence,
      language,
      data: {
        type: 'create_order',
        created: false,
        reason: 'multiple_customers',
        customers: customerMatches.map((c) => ({ id: c.id, name: c.name })),
      },
      sources: [],
    };
  }

  const customer = customerMatches[0];

  const productLookups = extracted.items.map((it) =>
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: it.productName, mode: 'insensitive' } },
          { nameEs: { contains: it.productName, mode: 'insensitive' } },
        ],
      },
      include: {
        prices: {
          where: { isCurrent: true },
        },
      },
      take: 5,
    }),
  );

  const productsPerItem = await Promise.all(productLookups);

  const pendingItems: PendingOrderItem[] = [];
  const sources: ChatSource[] = [];

  for (let index = 0; index < extracted.items.length; index += 1) {
    const input = extracted.items[index];
    const candidates = productsPerItem[index] || [];
    if (!candidates.length) {
      return {
        intent: 'create_order',
        confidence,
        language,
        data: {
          type: 'create_order',
          created: false,
          reason: 'product_not_found',
          productName: input.productName,
        },
        sources: [],
      };
    }

    const lowerName = input.productName.toLowerCase();
    const exact = candidates.find(
      (p) =>
        p.name.toLowerCase() === lowerName ||
        (p.nameEs ? p.nameEs.toLowerCase() === lowerName : false),
    );
    const product = exact || candidates[0];

    const price = product.prices.find((pr: any) => pr.isCurrent) || product.prices[0];
    if (!price) {
      return {
        intent: 'create_order',
        confidence,
        language,
        data: {
          type: 'create_order',
          created: false,
          reason: 'price_not_found',
          productId: product.id,
        },
        sources: [],
      };
    }

    const quantity = Number(input.quantity);
    const unitPrice = price.sellPrice != null ? Number(price.sellPrice) : Number(price.costPrice);
    const totalPrice = quantity * unitPrice;

    pendingItems.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unit: input.unit,
      unitPrice,
      totalPrice,
    });

    sources.push({
      type: 'product',
      id: product.id,
      label: product.name,
    });
  }

  const subtotal = pendingItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const taxRate = 0.13;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  let resolvedSendChannel: SendChannel | null = extracted.sendChannel;
  if (!resolvedSendChannel || resolvedSendChannel === 'none') {
    const preferred = (customer.preferredChannel || '').toLowerCase();
    if (preferred === 'whatsapp' || preferred === 'email' || preferred === 'telegram') {
      resolvedSendChannel = preferred as SendChannel;
    } else {
      resolvedSendChannel = 'none';
    }
  }

  if (!resolvedSendChannel || resolvedSendChannel === 'none') {
    resolvedSendChannel = null;
  }

  const pendingOrder: PendingOrder = {
    customerId: customer.id,
    customerName: customer.name,
    items: pendingItems,
    subtotal,
    taxRate,
    taxAmount,
    total,
    sendChannel: resolvedSendChannel,
    deliveryDate: extracted.deliveryDate,
    deliveryTime: extracted.deliveryTime,
    notes: extracted.notes,
  };

  sources.push({
    type: 'customer',
    id: customer.id,
    label: customer.name,
  });

  return {
    intent: 'create_order',
    confidence,
    language,
    data: {
      type: 'create_order',
      created: false,
      pendingOrder,
    },
    sources,
  };
}

export async function confirmOrderIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const pendingOrder = context?.pendingOrder as PendingOrder | undefined;

  if (!pendingOrder) {
    return {
      intent: 'confirm_order',
      confidence,
      language,
      data: {
        type: 'confirm_order',
        success: false,
        reason: 'no_pending_order',
      },
      sources: [],
    };
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: pendingOrder.customerId },
    });

    if (!customer) {
      return {
        intent: 'confirm_order',
        confidence,
        language,
        data: {
          type: 'confirm_order',
          success: false,
          reason: 'customer_not_found',
        },
        sources: [],
      };
    }

    const invoicesService = new InvoicesService();
    // Create Invoice with status SENT
    const invoice = await invoicesService.create(
      {
        customerId: customer.id,
        items: pendingOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.productName,
        })),
        status: 'SENT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        taxRate: pendingOrder.taxRate,
      },
      context?.userId,
    );

    // Generate PDF
    const pdfBuffer = generateInvoicePDF({
      invoiceNumber: invoice.number,
      customerName: customer.name,
      date: invoice.createdAt,
      items: invoice.items.map((item) => ({
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.totalPrice),
      })),
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
    });

    // Send via Channel
    let sentVia = 'none';
    const channel = pendingOrder.sendChannel;
    let notificationError: string | undefined;

    if (channel === 'whatsapp') {
      if (customer.phone) {
        try {
          const wa = new WhatsAppService();
          // Send message with link (since we can't easily attach PDF without public URL)
          await wa.sendMessage(
            customer.phone,
            language === 'en'
              ? `Your invoice ${invoice.number} has been generated. Total: $${invoice.total}.`
              : `Su factura ${invoice.number} ha sido generada. Total: $${invoice.total}.`,
          );
          sentVia = 'whatsapp';
          await createNotificationLog({
            channel: 'WHATSAPP',
            recipient: customer.phone,
            status: 'SENT',
            metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
          });
        } catch (error: any) {
          notificationError = error.message;
          await createNotificationLog({
            channel: 'WHATSAPP',
            recipient: customer.phone,
            status: 'FAILED',
            error: notificationError,
            metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
          });
        }
      } else {
        await createNotificationLog({
          channel: 'WHATSAPP',
          recipient: 'unknown',
          status: 'FAILED',
          error: 'Customer has no phone number',
          metadata: { invoiceId: invoice.id },
        });
      }
    } else if (channel === 'email') {
      if (customer.email) {
        try {
          await sendInvoiceEmail(
            customer.email,
            invoice.number,
            Buffer.from(pdfBuffer),
            customer.name,
          );
          sentVia = 'email';
          await createNotificationLog({
            channel: 'EMAIL',
            recipient: customer.email,
            status: 'SENT',
            metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
          });
        } catch (error: any) {
          notificationError = error.message;
          await createNotificationLog({
            channel: 'EMAIL',
            recipient: customer.email,
            status: 'FAILED',
            error: notificationError,
            metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
          });
        }
      } else {
        await createNotificationLog({
          channel: 'EMAIL',
          recipient: 'unknown',
          status: 'FAILED',
          error: 'Customer has no email address',
          metadata: { invoiceId: invoice.id },
        });
      }
    } else if (channel === 'telegram') {
      if (customer.telegramChatId) {
        try {
          await sendInvoiceDocument(
            customer.telegramChatId,
            invoice.number,
            Buffer.from(pdfBuffer),
            customer.name,
          );
          sentVia = 'telegram';
          await createNotificationLog({
            channel: 'TELEGRAM',
            recipient: customer.telegramChatId,
            status: 'SENT',
            metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
          });
        } catch (error: any) {
          notificationError = error.message;
          await createNotificationLog({
            channel: 'TELEGRAM',
            recipient: customer.telegramChatId,
            status: 'FAILED',
            error: notificationError,
            metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
          });
        }
      } else {
        await createNotificationLog({
          channel: 'TELEGRAM',
          recipient: 'unknown',
          status: 'FAILED',
          error: 'Customer has no telegram chat ID',
          metadata: { invoiceId: invoice.id },
        });
      }
    }

    await logAudit({
      userId: context?.userId || undefined,
      action: 'CONFIRM_ORDER',
      entityType: 'invoice',
      entityId: invoice.id,
      changes: {
        status: { old: null, new: 'SENT' },
        channel: { old: null, new: sentVia },
        amount: { old: null, new: invoice.total },
      },
    });

    return {
      intent: 'confirm_order',
      confidence,
      language,
      data: {
        type: 'confirm_order',
        success: true,
        invoice: {
          id: invoice.id,
          number: invoice.number,
          total: invoice.total,
        },
        sentVia,
      },
      sources: [
        {
          type: 'invoice',
          id: invoice.id,
          label: invoice.number,
        },
      ],
    };
  } catch (error) {
    console.error('[CONFIRM_ORDER_ERROR]', error);
    return {
      intent: 'confirm_order',
      confidence,
      language,
      data: {
        type: 'confirm_order',
        success: false,
        reason: 'internal_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      sources: [],
    };
  }
}

export async function cancelOrderIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  return {
    intent: 'cancel_order',
    confidence,
    language,
    data: {
      type: 'cancel_order',
      success: true,
    },
    sources: [],
  };
}

