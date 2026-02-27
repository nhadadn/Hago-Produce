import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { productSchema } from '@/lib/validation/product';
import { createSupplierSchema } from '@/lib/validation/suppliers';
import { createCustomerSchema } from '@/lib/validation/customers';
import { productPriceSchema } from '@/lib/validation/product-price';
import { createInvoiceSchema, updateInvoiceSchema } from '@/lib/validation/invoices';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from '@/lib/services/invoices.service';
import { ProductPriceService } from '@/lib/services/product-prices/product-prices.service';
import { logger } from '@/lib/logger/logger.service';

type RateLimitKey = string;

interface RateLimitState {
  timestamps: number[];
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 100;

const rateLimitStore = new Map<RateLimitKey, RateLimitState>();

function getRateLimitMax(): number {
  const raw = process.env.WEBHOOK_RATE_LIMIT;
  if (!raw) return DEFAULT_MAX_REQUESTS;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_MAX_REQUESTS;
  return parsed;
}

function getRateLimitKey(apiKey: string | null): RateLimitKey {
  if (apiKey) return apiKey;
  return 'anonymous';
}

function isRateLimited(key: RateLimitKey): boolean {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_MS;
  const maxRequests = getRateLimitMax();

  const state = rateLimitStore.get(key) || { timestamps: [] };
  const recent = state.timestamps.filter((ts) => now - ts < windowMs);
  recent.push(now);
  state.timestamps = recent;
  rateLimitStore.set(key, state);
  return recent.length > maxRequests;
}

const eventTypeSchema = z.enum([
  'product.created',
  'product.updated',
  'supplier.created',
  'supplier.updated',
  'price.created',
  'price.updated',
  'customer.created',
  'customer.updated',
  'invoice.created',
  'invoice.updated',
]);

const webhookPayloadSchema = z.object({
  eventType: eventTypeSchema,
  data: z.record(z.any()),
  timestamp: z.string(),
  idempotencyKey: z.string().optional(),
});

const productEventDataSchema = productSchema.extend({
  id: z.string().uuid().optional(),
});

const supplierEventDataSchema = createSupplierSchema.extend({
  id: z.string().uuid().optional(),
});

const customerEventDataSchema = createCustomerSchema.extend({
  id: z.string().uuid().optional(),
});

const productPriceEventDataSchema = productPriceSchema.extend({
  id: z.string().uuid().optional(),
});

const makePriceFromNamesSchema = z.object({
  product_name: z.string(),
  supplier_name: z.string(),
  cost_price: z.number().nonnegative(),
  sell_price: z.number().nonnegative().optional(),
  currency: z.string().default('CAD'),
  effective_date: z.string().optional(),
  source: z.string().optional(),
});

const invoiceCreateEventDataSchema = createInvoiceSchema;

const invoiceUpdateEventDataSchema = updateInvoiceSchema.extend({
  id: z.string().uuid(),
});

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No autorizado para consumir este webhook.',
      },
    },
    { status: 401 },
  );
}

function rateLimitedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiadas solicitudes desde esta API key. Intente de nuevo más tarde.',
      },
    },
    { status: 429 },
  );
}

function validationErrorResponse(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    },
    { status: 400 },
  );
}

async function logWebhook(params: {
  source: string;
  apiKey: string | null;
  idempotencyKey: string | null;
  eventType: string;
  status: 'success' | 'error';
  httpStatus: number;
  errorCode?: string;
  errorMessage?: string;
  payload: unknown;
  responseBody: unknown;
}) {
  try {
    await prisma.webhookLog.create({
      data: {
        source: params.source,
        apiKey: params.apiKey ?? null,
        idempotencyKey: params.idempotencyKey ?? null,
        eventType: params.eventType,
        status: params.status,
        httpStatus: params.httpStatus,
        errorCode: params.errorCode ?? null,
        errorMessage: params.errorMessage ?? null,
        payload: params.payload as any,
        responseBody: params.responseBody as any,
      },
    });
  } catch (error) {
    logger.error('[WEBHOOK_LOG_ERROR]', error);
  }
}

async function findCachedResponse(source: string, idempotencyKey: string): Promise<{
  httpStatus: number;
  body: any;
} | null> {
  const log = await prisma.webhookLog.findFirst({
    where: {
      source,
      idempotencyKey,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!log || !log.responseBody) return null;

  return {
    httpStatus: log.httpStatus,
    body: log.responseBody as any,
  };
}

async function processProductEvent(eventType: z.infer<typeof eventTypeSchema>, data: unknown) {
  const parsed = productEventDataSchema.parse(data);

  const where = parsed.id
    ? { id: parsed.id }
    : parsed.sku
      ? { sku: parsed.sku }
      : null;

  if (!where) {
    throw new Error('Producto sin identificador válido (id o sku).');
  }

  const existing = await prisma.product.findFirst({
    where,
  });

  const payload = {
    name: parsed.name,
    nameEs: parsed.nameEs ?? null,
    description: parsed.description ?? null,
    category: parsed.category ?? null,
    unit: parsed.unit,
    sku: parsed.sku,
    isActive: parsed.isActive,
  };

  if (!existing) {
    await prisma.product.create({
      data: {
        ...(parsed.id ? { id: parsed.id } : {}),
        ...payload,
      },
    });
    return { action: 'created' };
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: payload,
  });
  return { action: 'updated' };
}

async function processSupplierEvent(eventType: z.infer<typeof eventTypeSchema>, data: unknown) {
  const parsed = supplierEventDataSchema.parse(data);

  const where = parsed.id ? { id: parsed.id } : { name: parsed.name };

  const existing = await prisma.supplier.findFirst({
    where,
  });

  const payload = {
    name: parsed.name,
    contactName: parsed.contactName,
    email: parsed.email,
    phone: parsed.phone,
    address: parsed.address,
    isActive: parsed.isActive ?? true,
  };

  if (!existing) {
    await prisma.supplier.create({
      data: {
        ...(parsed.id ? { id: parsed.id } : {}),
        ...payload,
      },
    });
    return { action: 'created' };
  }

  await prisma.supplier.update({
    where: { id: existing.id },
    data: payload,
  });
  return { action: 'updated' };
}

async function processCustomerEvent(eventType: z.infer<typeof eventTypeSchema>, data: unknown) {
  const parsed = customerEventDataSchema.parse(data);

  const where = parsed.id ? { id: parsed.id } : { taxId: parsed.taxId };

  const existing = await prisma.customer.findFirst({
    where,
  });

  const payload = {
    name: parsed.name,
    taxId: parsed.taxId,
    email: parsed.email,
    phone: parsed.phone,
    address: parsed.address,
    isActive: parsed.isActive ?? true,
  };

  if (!existing) {
    await prisma.customer.create({
      data: {
        ...(parsed.id ? { id: parsed.id } : {}),
        ...payload,
      },
    });
    return { action: 'created' };
  }

  await prisma.customer.update({
    where: { id: existing.id },
    data: payload,
  });
  return { action: 'updated' };
}

async function processPriceEvent(eventType: z.infer<typeof eventTypeSchema>, data: unknown) {
  const parsedStandard = productPriceEventDataSchema.safeParse(data);

  if (parsedStandard.success) {
    const parsed = parsedStandard.data;

    if (eventType === 'price.created') {
      await ProductPriceService.create({
        id: parsed.id,
        productId: parsed.productId,
        supplierId: parsed.supplierId,
        costPrice: parsed.costPrice,
        sellPrice: parsed.sellPrice,
        currency: parsed.currency,
        effectiveDate: parsed.effectiveDate,
        isCurrent: parsed.isCurrent,
        source: parsed.source ?? 'make_automation',
      });

      return { action: 'created' };
    }

    if (!parsed.id) {
      throw new Error('Para price.updated se requiere id del registro de precio.');
    }

    await ProductPriceService.update(parsed.id, {
      costPrice: parsed.costPrice,
      sellPrice: parsed.sellPrice,
      currency: parsed.currency,
      effectiveDate: parsed.effectiveDate,
      isCurrent: parsed.isCurrent,
      source: parsed.source ?? 'make_automation',
    });

    return { action: 'updated' };
  }

  const makeParsed = makePriceFromNamesSchema.parse(data);

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { name: { equals: makeParsed.product_name, mode: 'insensitive' } },
        { nameEs: { equals: makeParsed.product_name, mode: 'insensitive' } },
      ],
    },
  });

  if (!product) {
    throw new Error('Producto no encontrado para el nombre proporcionado.');
  }

  let supplier = await prisma.supplier.findUnique({
    where: { name: makeParsed.supplier_name },
  });

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: makeParsed.supplier_name,
        isActive: true,
      },
    });
  }

  const effectiveDate = makeParsed.effective_date
    ? new Date(makeParsed.effective_date)
    : new Date();

  const result = await ProductPriceService.create({
    productId: product.id,
    supplierId: supplier!.id,
    costPrice: Number(makeParsed.cost_price),
    sellPrice: makeParsed.sell_price ? Number(makeParsed.sell_price) : undefined,
    currency: makeParsed.currency,
    effectiveDate: effectiveDate,
    isCurrent: true,
    source: 'make_automation',
  });

  return {
    action: 'created',
    data: result
  };
}

async function processInvoiceEvent(eventType: z.infer<typeof eventTypeSchema>, data: unknown) {
  const invoicesService = new InvoicesService();

  if (eventType === 'invoice.created') {
    const parsed = invoiceCreateEventDataSchema.parse(data);
    const invoice = await invoicesService.create(parsed);
    return { action: 'created', invoiceId: invoice.id, number: invoice.number };
  }

  const parsedUpdate = invoiceUpdateEventDataSchema.parse(data);
  const invoiceId = parsedUpdate.id;
  const { id: _ignored, ...updateData } = parsedUpdate;

  const invoice = await invoicesService.update(invoiceId, updateData, undefined);

  return { action: 'updated', invoiceId: invoice.id, number: invoice.number, status: invoice.status };
}

async function processEvent(eventType: z.infer<typeof eventTypeSchema>, data: unknown) {
  if (eventType.startsWith('product.')) {
    return processProductEvent(eventType, data);
  }
  if (eventType.startsWith('supplier.')) {
    return processSupplierEvent(eventType, data);
  }
  if (eventType.startsWith('customer.')) {
    return processCustomerEvent(eventType, data);
  }
  if (eventType.startsWith('price.')) {
    return processPriceEvent(eventType, data);
  }
  if (eventType.startsWith('invoice.')) {
    return processInvoiceEvent(eventType, data);
  }

  throw new Error(`Tipo de evento no soportado: ${eventType}`);
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-make-api-key') ?? req.headers.get('x-api-key');

  if (!apiKey || apiKey !== process.env.MAKE_WEBHOOK_API_KEY) {
    return unauthorizedResponse();
  }

  const rateKey = getRateLimitKey(apiKey);
  if (isRateLimited(rateKey)) {
    return rateLimitedResponse();
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch (error) {
    return validationErrorResponse('Payload JSON inválido.');
  }

  const parsedPayload = webhookPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return validationErrorResponse('Payload de webhook inválido.');
  }

  const body = parsedPayload.data;
  const idempotencyKey =
    body.idempotencyKey ??
    req.headers.get('x-make-idempotency-key') ??
    req.headers.get('x-idempotency-key');

  if (idempotencyKey) {
    const cached = await findCachedResponse('make', idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.body, { status: cached.httpStatus });
    }
  }

  let httpStatus = 200;
  let responseBody: any = {
    success: true,
    data: {
      processed: true,
    },
  };

  try {
    const result = await processEvent(body.eventType, body.data);

    responseBody = {
      success: true,
      data: {
        eventType: body.eventType,
        result,
      },
    };
    httpStatus = 200;
  } catch (error) {
    logger.error('[MAKE_WEBHOOK_ERROR]', error);

    httpStatus = 500;
    responseBody = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno al procesar el webhook.',
      },
    };
  }

  await logWebhook({
    source: 'make',
    apiKey,
    idempotencyKey: idempotencyKey ?? null,
    eventType: body.eventType,
    status: httpStatus >= 200 && httpStatus < 300 ? 'success' : 'error',
    httpStatus,
    errorCode: httpStatus >= 400 ? responseBody.error?.code : undefined,
    errorMessage: httpStatus >= 400 ? responseBody.error?.message : undefined,
    payload: body,
    responseBody,
  });

  return NextResponse.json(responseBody, { status: httpStatus });
}
