import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { logger } from '@/lib/logger/logger.service';

export async function bestSupplierIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  let searchTerm: string = String(params.searchTerm || '').trim();

  // Sanitización de entrada y verificación de longitud
  if (searchTerm.length > 1000) {
    logger.warn(`[BestSupplier] Input too long (${searchTerm.length} chars). Truncating to 1000.`);
    searchTerm = searchTerm.substring(0, 1000);
  }

  if (!searchTerm) {
    return {
      intent: 'best_supplier',
      confidence,
      language,
      data: { type: 'best_supplier', query: searchTerm, items: [] },
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
      include: {
        product: true,
        supplier: true,
      },
    });

    const sorted = [...prices].sort((a, b) => Number(a.costPrice) - Number(b.costPrice));
    const top = sorted.slice(0, 5);

    const items = top.map((p) => ({
      productId: p.productId,
      productName: p.product.name,
      supplierId: p.supplierId,
      supplierName: p.supplier.name,
      costPrice: Number(p.costPrice),
      sellPrice: p.sellPrice != null ? Number(p.sellPrice) : null,
      currency: p.currency,
      effectiveDate: p.effectiveDate.toISOString(),
    }));

    const sources: ChatSource[] = top.map((p) => ({
      type: 'product_price',
      id: p.id,
      label: `${p.product.name} - ${p.supplier.name}`,
    }));

    return {
      intent: 'best_supplier',
      confidence,
      language,
      data: {
        type: 'best_supplier',
        query: searchTerm,
        items,
      },
      sources,
    };
  } catch (error) {
    logger.error(`[BestSupplier] Error fetching best suppliers: ${error}`);
    // Return empty result with error indication or throw?
    // User asked to "handle" error. Rethrowing after logging is a form of handling (observability).
    // Returning empty array might hide the error.
    // I will throw to let the caller decide, but I've logged it.
    throw error;
  }
}

