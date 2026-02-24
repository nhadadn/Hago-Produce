import prisma from '@/lib/db';
import { ChatLanguage, ChatServiceContext, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { Decimal } from '@prisma/client/runtime/library';
import { logAudit } from '@/lib/audit/logger';
import { createNotificationLog } from '@/lib/services/notifications/notification-log.service';
import { purchaseOrdersService } from '@/lib/services/purchase-orders.service';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// --- Interfaces ---

interface ExtractedPurchaseOrderItem {
  productName: string;
  quantity: number;
  unit: 'kg' | 'lb' | 'unit' | 'box' | 'case';
}

interface ExtractedPurchaseOrderParams {
  items: ExtractedPurchaseOrderItem[];
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
  recipientName?: string;
}

interface SupplierItemMatch {
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

interface PendingPurchaseOrder {
  supplierId: string;
  supplierName: string;
  items: SupplierItemMatch[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
  recipientName?: string;
}

// --- Definición de Función OpenAI ---

function buildExtractFunctionDefinition(language: ChatLanguage) {
  const description =
    language === 'en'
      ? 'Extracts purchase order parameters from the user message'
      : 'Extrae los parámetros de una orden de compra desde el mensaje del usuario';

  return {
    name: 'extract_purchase_order_parameters',
    description,
    parameters: {
      type: 'object',
      properties: {
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
        delivery_date: { type: 'string', description: 'ISO 8601 format YYYY-MM-DD' },
        delivery_time: { type: 'string' },
        notes: { type: 'string' },
        recipient_name: { type: 'string' },
      },
      required: ['items'],
    },
  };
}

// --- Lógica de Extracción ---

export async function extractPurchaseOrderParams(
  message: string,
  language: ChatLanguage
): Promise<ExtractedPurchaseOrderParams | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return basicRegexFallback(message);
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const tools = [{ type: 'function', function: buildExtractFunctionDefinition(language) }];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        tools,
        tool_choice: { type: 'function', function: { name: 'extract_purchase_order_parameters' } },
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return basicRegexFallback(message);
    }

    const json = await response.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== 'extract_purchase_order_parameters') {
      return basicRegexFallback(message);
    }

    const args = JSON.parse(toolCall.function.arguments);
    
    return {
      items: args.items?.map((it: any) => ({
        productName: it.product_name,
        quantity: Number(it.quantity),
        unit: it.unit || 'unit',
      })) || [],
      deliveryDate: args.delivery_date,
      deliveryTime: args.delivery_time,
      notes: args.notes,
      recipientName: args.recipient_name,
    };
  } catch (error) {
    console.error('Error extracting purchase order params:', error);
    return basicRegexFallback(message);
  }
}

function basicRegexFallback(message: string): ExtractedPurchaseOrderParams | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  const items: ExtractedPurchaseOrderItem[] = [];
  
  // Estrategia: Encontrar todas las coincidencias de "N Unit de Producto" en la cadena
  const globalRegex = /(\d+(?:[.,]\d+)?)\s+(kg|kilos|kilo|lb|lbs|libra|libras|unit|unidad|unidades|box|caja|cajas|case)\s+(?:de\s+)?((?:(?!(\d+\s+(?:kg|kilos|kilo|lb|lbs|libra|libras|unit|unidad|unidades|box|caja|cajas|case))).)+)/gi;

  let match;
  while ((match = globalRegex.exec(trimmed)) !== null) {
      const quantity = Number(match[1].replace(',', '.'));
      const unitToken = match[2].toLowerCase();
      let unit: ExtractedPurchaseOrderItem['unit'] = 'unit';
      if (unitToken.startsWith('kg') || unitToken.startsWith('kilo')) unit = 'kg';
      else if (unitToken.startsWith('lb') || unitToken.startsWith('libra')) unit = 'lb';
      else if (unitToken.startsWith('box') || unitToken.startsWith('caja')) unit = 'box';
      else if (unitToken.startsWith('case')) unit = 'case';
      
      // Limpiar nombre del producto: eliminar " y", ",", "." al final
      let productName = match[3].trim();
      productName = productName.replace(/^(?:de\s+)/, ''); // Eliminar "de " si se capturó (regex lo maneja pero por si acaso)
      productName = productName.replace(/[\s,.]+(?:y|e|and)$/, ''); // Eliminar conectores finales
      productName = productName.replace(/[\s,.]+$/, ''); // Eliminar puntuación final
      
      if (productName && Number.isFinite(quantity) && quantity > 0) {
        items.push({ productName, quantity, unit });
      }
  }

  if (!items.length) return null;

  return { items };
}

// --- Lógica de Selección de Proveedores ---

async function findBestSuppliersForItems(
  items: ExtractedPurchaseOrderItem[]
): Promise<{ matches: SupplierItemMatch[]; errors: string[] }> {
  const matches: SupplierItemMatch[] = [];
  const errors: string[] = [];

  for (const item of items) {
    // 1. Buscar producto
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: item.productName, mode: 'insensitive' } },
          { nameEs: { contains: item.productName, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: {
        prices: {
          where: { isCurrent: true },
          include: { supplier: true },
          orderBy: { costPrice: 'asc' }, // Best price first
        },
      },
      take: 1,
    });

    const product = products[0];

    if (!product) {
      errors.push(item.productName);
      continue;
    }

    // 2. Buscar mejor precio
    const bestPrice = product.prices[0]; // Ya ordenado por costPrice ASC

    if (!bestPrice) {
      errors.push(`${item.productName} (No active price found)`);
      continue;
    }

    // 3. Calcular totales
    const unitPrice = Number(bestPrice.costPrice);
    const quantity = item.quantity;
    const totalPrice = unitPrice * quantity;

    matches.push({
      productId: product.id,
      productName: product.name,
      supplierId: bestPrice.supplierId,
      supplierName: bestPrice.supplier.name,
      quantity,
      unit: item.unit,
      unitPrice,
      totalPrice,
      currency: bestPrice.currency,
    });
  }

  return { matches, errors };
}

// --- Lógica de Generación de Órdenes ---

function generatePendingPurchaseOrders(
  matches: SupplierItemMatch[],
  params: ExtractedPurchaseOrderParams
): PendingPurchaseOrder[] {
  // Agrupar por proveedor
  const bySupplier: Record<string, SupplierItemMatch[]> = {};

  for (const match of matches) {
    if (!bySupplier[match.supplierId]) {
      bySupplier[match.supplierId] = [];
    }
    bySupplier[match.supplierId].push(match);
  }

  const pendingOrders: PendingPurchaseOrder[] = [];

  for (const supplierId in bySupplier) {
    const items = bySupplier[supplierId];
    const supplierName = items[0].supplierName;

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.13; // 13% HST
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    pendingOrders.push({
      supplierId,
      supplierName,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      deliveryDate: params.deliveryDate,
      deliveryTime: params.deliveryTime,
      notes: params.notes,
      recipientName: params.recipientName,
    });
  }

  return pendingOrders;
}

// --- Handler Principal de Intención ---

export async function createPurchaseOrderIntent(
  params: any,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext
): Promise<QueryExecutionResult> {
  const message = context?.message?.message || params?.rawMessage || params?.searchTerm || '';
  
  // 1. Extraer parámetros
  let extracted = await extractPurchaseOrderParams(message, language);
  
  // Si los parámetros se pasaron directamente (ej. desde tests), fusionarlos
  if (params && params.items) {
      extracted = { ...extracted, ...params };
  }

  if (!extracted || !extracted.items.length) {
    return {
      intent: 'create_purchase_order',
      confidence,
      language,
      data: {
        type: 'create_purchase_order',
        created: false,
        reason: 'missing_items',
      },
      sources: [],
    };
  }

  // 2. Buscar proveedores
  const { matches, errors } = await findBestSuppliersForItems(extracted.items);

  if (matches.length === 0) {
    return {
      intent: 'create_purchase_order',
      confidence,
      language,
      data: {
        type: 'create_purchase_order',
        created: false,
        reason: 'no_products_found',
        notFoundItems: errors,
      },
      sources: [],
    };
  }

  // 3. Generar órdenes pendientes
  const pendingOrders = generatePendingPurchaseOrders(matches, extracted);

  // 4. Retornar resultado
  return {
    intent: 'create_purchase_order',
    confidence,
    language,
    data: {
      type: 'create_purchase_order',
      created: false, // Esperar confirmación
      pendingOrders,
      notFoundItems: errors.length > 0 ? errors : undefined,
    },
    sources: matches.map(m => ({
        type: 'supplier',
        id: m.supplierId,
        label: m.supplierName
    })),
  };
}

// --- Lógica de Confirmación y Cancelación ---

export async function confirmPurchaseOrderIntent(
  params: any,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext
): Promise<QueryExecutionResult> {
  const pendingOrders = context?.pendingPurchaseOrders as PendingPurchaseOrder[] | undefined;

  if (!pendingOrders || !pendingOrders.length) {
    return {
      intent: 'confirm_purchase_order',
      confidence,
      language,
      data: {
        type: 'confirm_purchase_order',
        success: false,
        reason: 'no_pending_orders',
      },
      sources: [],
    };
  }

  const createdOrders: any[] = [];
  const errors: any[] = [];
  const sources: ChatSource[] = [];

  for (const po of pendingOrders) {
    try {
      // 1. Crear Orden usando el servicio centralizado
      const order = await purchaseOrdersService.createPurchaseOrder({
        supplierId: po.supplierId,
        items: po.items.map((item) => ({
          productId: item.productId,
          description: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        subtotal: po.subtotal,
        taxRate: po.taxRate,
        taxAmount: po.taxAmount,
        total: po.total,
        notes: po.notes,
        deliveryDate: po.deliveryDate ? new Date(po.deliveryDate) : undefined,
        deliveryTime: po.deliveryTime,
      });

      createdOrders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        supplierName: po.supplierName,
        total: Number(order.total),
      });

      sources.push({
        type: 'purchase_order',
        id: order.id,
        label: order.orderNumber,
      });

      // 2. Registrar Auditoría
      await logAudit({
        userId: context?.userId,
        action: 'CREATE_PURCHASE_ORDER',
        entityType: 'purchase_order',
        entityId: order.id,
        changes: { 
          amount: { old: null, new: Number(order.total) }, 
          supplier: { old: null, new: po.supplierName } 
        },
      });

      // 3. Enviar Notificación al Proveedor
      // Prioridad: Email > WhatsApp
      const channel = order.supplier.email ? 'EMAIL' : (order.supplier.phone ? 'WHATSAPP' : null);
      
      if (channel) {
          await purchaseOrdersService.sendPurchaseOrderToSupplier(order.id, channel);
      } else {
          console.warn(`No contact channel found for supplier ${po.supplierName} (PO: ${order.orderNumber})`);
          // Registrar fallo de notificación
          await createNotificationLog({
            channel: 'UNKNOWN',
            recipient: 'unknown',
            status: 'FAILED',
            error: 'No email or phone found for supplier',
            metadata: { purchaseOrderId: order.id, orderNumber: order.orderNumber },
          });
      }

    } catch (error) {
      console.error('Error creating purchase order:', error);
      errors.push({ supplierName: po.supplierName, error: String(error) });
    }
  }

  return {
    intent: 'confirm_purchase_order',
    confidence,
    language,
    data: {
      type: 'confirm_purchase_order',
      success: createdOrders.length > 0,
      createdOrders,
      errors: errors.length > 0 ? errors : undefined,
    },
    sources,
  };
}

export async function cancelPurchaseOrderIntent(
  params: any,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext
): Promise<QueryExecutionResult> {
  return {
    intent: 'cancel_purchase_order',
    confidence,
    language,
    data: {
      type: 'cancel_purchase_order',
      success: true,
    },
    sources: [],
  };
}
