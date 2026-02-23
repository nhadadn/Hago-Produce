import prisma from '@/lib/db';
import { ChatLanguage, ChatServiceContext, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { InvoiceStatus } from '@prisma/client';

interface OrderItemInput {
  productName: string;
  quantity: number;
}

export async function createOrderIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const customerName: string | undefined = params.customerName;
  const items: OrderItemInput[] = Array.isArray(params.items)
    ? params.items
    : [];

  if (!customerName || items.length === 0) {
    return {
      intent: 'create_order',
      confidence,
      language,
      data: {
        type: 'create_order',
        created: false,
        reason: 'missing_customer_or_items',
      },
      sources: [],
    };
  }

  const customer = await prisma.customer.findFirst({
    where: {
      name: { contains: customerName, mode: 'insensitive' },
    },
  });

  if (!customer) {
    return {
      intent: 'create_order',
      confidence,
      language,
      data: {
        type: 'create_order',
        created: false,
        reason: 'customer_not_found',
      },
      sources: [],
    };
  }

  const productLookups = items.map((it) =>
    prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { contains: it.productName, mode: 'insensitive' } },
          { nameEs: { contains: it.productName, mode: 'insensitive' } },
        ],
      },
    }),
  );

  const foundProducts = await Promise.all(productLookups);

  if (foundProducts.some((p) => !p)) {
    return {
      intent: 'create_order',
      confidence,
      language,
      data: {
        type: 'create_order',
        created: false,
        reason: 'product_not_found',
      },
      sources: [],
    };
  }

  const now = new Date();

  const invoice = await prisma.invoice.create({
    data: {
      number: `DRAFT-${now.getTime()}`,
      customerId: customer.id,
      status: InvoiceStatus.DRAFT,
      issueDate: now,
      dueDate: now,
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      total: 0,
      items: {
        create: items.map((it, index) => {
          const product = foundProducts[index]!;
          return {
            productId: product.id,
            description: product.name,
            quantity: it.quantity,
            unitPrice: 0,
            totalPrice: 0,
          };
        }),
      },
    },
  });

  const sources: ChatSource[] = [
    {
      type: 'invoice',
      id: invoice.id,
      label: invoice.number,
    },
    {
      type: 'customer',
      id: customer.id,
      label: customer.name,
    },
  ];

  return {
    intent: 'create_order',
    confidence,
    language,
    data: {
      type: 'create_order',
      created: true,
      invoiceId: invoice.id,
      number: invoice.number,
    },
    sources,
  };
}

