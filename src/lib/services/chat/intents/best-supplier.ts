import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { logger } from '@/lib/logger/logger.service';
import { cleanSearchTerm } from '@/lib/services/chat/utils/text-utils';

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

  // Guardia defensiva usando utilidad compartida (SHOULD 1)
  searchTerm = cleanSearchTerm(searchTerm);

  if (!searchTerm) {
    return {
      intent: 'best_supplier',
      confidence,
      language,
      data: { type: 'best_supplier', query: searchTerm, items: [] },
      sources: [],
    };
  }

  // MUST 2: Soporte para maxResults dinámico
  const requestedLimit = Number(params.maxResults);
  const limit = (!isNaN(requestedLimit) && requestedLimit > 0 && requestedLimit <= 10) ? requestedLimit : 5;

  try {
    const prices = await prisma.productPrice.findMany({
      where: {
        isCurrent: true,
        // MUST 1: Filtro de datos sucios (costPrice > 0)
        // Prisma Decimal se maneja mejor comparando con string o number
        // Asumiendo que costPrice es Decimal en schema
        costPrice: {
          gt: 0,
        },
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
      // SHOULD 3: Query con límite explícito para proteger memoria
      take: 100, 
    });

    // Manejo de resultados vacíos: Búsqueda de sugerencias (MUST 1 fallback)
    if (prices.length === 0) {
      const suggestions = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { nameEs: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { name: true, nameEs: true },
        take: 3,
      });

      const suggestionList = suggestions.map(s => language === 'en' ? s.name : (s.nameEs || s.name));

      return {
        intent: 'best_supplier',
        confidence,
        language,
        data: {
          type: 'best_supplier',
          query: searchTerm,
          items: [],
          suggestions: suggestionList
        },
        sources: [],
      };
    }

    // Ordenamiento en memoria y desempate (SHOULD 2)
    // Filter out records where costPrice converts to NaN (e.g. bad Decimal)
    const validPrices = prices.filter(p => !isNaN(Number(p.costPrice)));

    // Se ordena el array de resultados de Prisma antes de mapear
    const sorted = [...validPrices].sort((a, b) => {
      const priceA = Number(a.costPrice);
      const priceB = Number(b.costPrice);
      const priceDiff = priceA - priceB;

      if (priceDiff !== 0) return priceDiff;

      // Desempate secundario por nombre de proveedor
      // Usamos supplier.name directamente del objeto Prisma
      return a.supplier.name.localeCompare(b.supplier.name);
    });

    // Aplicar límite solicitado (MUST 2)
    const top = sorted.slice(0, limit);

    // Mapeo final estandarizado (MUST 3)
    const items = top.map((p, index) => {
      const costPrice = Number(p.costPrice);
      const rawSellPrice = p.sellPrice != null ? Number(p.sellPrice) : null;

      return {
        productId: p.productId,
        productName: p.product.name,
        productNameEs: p.product.nameEs, // Agregado para paridad
        supplierId: p.supplierId,
        supplierName: p.supplier.name,
        costPrice: costPrice,
        sellPrice: rawSellPrice,
        currency: p.currency,
        effectiveDate: p.effectiveDate.toISOString(),
        // Nuevos campos estandarizados
        displayPrice: costPrice,
        displayPriceType: 'cost',
        rank: index + 1,
      };
    });

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
    throw error;
  }
}
