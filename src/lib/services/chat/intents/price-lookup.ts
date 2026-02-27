import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { logger } from '@/lib/logger/logger.service';

export async function priceLookupIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  let searchTerm: string = String(params.searchTerm || '').trim();

  // Sanitización de entrada y verificación de longitud
  if (searchTerm.length > 1000) {
    logger.warn(`[PriceLookup] Input too long (${searchTerm.length} chars). Truncating to 1000.`);
    searchTerm = searchTerm.substring(0, 1000);
  }

  if (!searchTerm) {
    return {
      intent: 'price_lookup',
      confidence,
      language,
      data: { type: 'price_lookup', query: searchTerm, items: [] },
      sources: [],
    };
  }

  try {
    const prices = await prisma.productPrice.findMany({
      where: {
        isCurrent: true,
        product: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { nameEs: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      },
      orderBy: { effectiveDate: 'desc' },
      include: {
        product: true,
        supplier: true,
      },
      take: 20,
    });

    const items = prices.map((p) => ({
      productId: p.productId,
      productName: p.product.name,
      supplierId: p.supplierId,
      supplierName: p.supplier.name,
      costPrice: Number(p.costPrice),
      sellPrice: p.sellPrice != null ? Number(p.sellPrice) : null,
      currency: p.currency,
      effectiveDate: p.effectiveDate.toISOString(),
    }));

    const sources: ChatSource[] = prices.map((p) => ({
      type: 'product_price',
      id: p.id,
      label: `${p.product.name} - ${p.supplier.name}`,
    }));

    return {
      intent: 'price_lookup',
      confidence,
      language,
      data: {
        type: 'price_lookup',
        query: searchTerm,
        items,
      },
      sources,
    };
  } catch (error) {
    logger.error(`[PriceLookup] Error executing query: ${error}`);
    throw error;
  }
}

