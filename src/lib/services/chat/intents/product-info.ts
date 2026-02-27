import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';

export async function productInfoIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  let searchTerm: string = String(params.productName || params.searchTerm || '').trim();

  // Sanitización de entrada y verificación de longitud
  if (searchTerm.length > 1000) {
    logger.warn(`[ProductInfo] Input too long (${searchTerm.length} chars). Truncating to 1000.`);
    searchTerm = searchTerm.substring(0, 1000);
  }

  if (!searchTerm) {
    return {
      intent: 'product_info',
      confidence,
      language,
      data: { type: 'product_info', query: searchTerm, items: [] },
      sources: [],
    };
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { nameEs: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        prices: {
          where: { isCurrent: true },
          include: {
            supplier: true,
          },
        },
      },
      take: 5,
    });

    const items = products.map((p) => ({
      productId: p.id,
      name: p.name,
      nameEs: p.nameEs,
      category: p.category,
      unit: p.unit,
      sku: p.sku,
      prices: p.prices.map((pr) => ({
        id: pr.id,
        supplierId: pr.supplierId,
        supplierName: pr.supplier.name,
        costPrice: Number(pr.costPrice),
        sellPrice: pr.sellPrice != null ? Number(pr.sellPrice) : null,
        currency: pr.currency,
        effectiveDate: pr.effectiveDate.toISOString(),
      })),
    }));

    const sources: ChatSource[] = products.map((p) => ({
      type: 'product_price',
      id: p.id,
      label: p.name,
    }));

    return {
      intent: 'product_info',
      confidence,
      language,
      data: {
        type: 'product_info',
        query: searchTerm,
        items,
      },
      sources,
    };
  } catch (error) {
    logger.error(`[ProductInfo] Error executing query: ${error}`);
    throw error;
  }
}

