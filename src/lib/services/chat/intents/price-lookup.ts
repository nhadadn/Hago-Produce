import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { logger } from '@/lib/logger/logger.service';
import { cleanSearchTerm } from '@/lib/services/chat/utils/text-utils';

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

  // Guardia defensiva usando utilidad compartida
  searchTerm = cleanSearchTerm(searchTerm);

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
    // 1. Construir filtros base
    const whereClause: any = {
      isCurrent: true,
      product: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { nameEs: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
    };

    // Filtro opcional por proveedor si viene en params
    if (params.supplierName) {
      whereClause.supplier = {
        name: { contains: params.supplierName, mode: 'insensitive' },
      };
    }

    // 2. Ejecutar consulta principal de precios
    const prices = await prisma.productPrice.findMany({
      where: whereClause,
      // Ordenamos por fecha primero, pero reordenaremos en memoria
      orderBy: { effectiveDate: 'desc' },
      include: {
        product: true,
        supplier: true,
      },
      take: 50, // Aumentamos límite para permitir mejor agrupación
    });

    // 3. Manejo de resultados vacíos: Búsqueda de sugerencias (MUST 1)
    if (prices.length === 0) {
      // Buscar productos similares que quizás no tengan precio activo o proveedor específico
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
        intent: 'price_lookup',
        confidence,
        language,
        data: {
          type: 'price_lookup',
          query: searchTerm,
          items: [],
          suggestions: suggestionList
        },
        sources: [],
      };
    }

    // 4. Agrupación y Ordenamiento (MUST 2)
    // Agrupar por Producto
    const groupedByProduct = prices.reduce((acc, price) => {
      const prodId = price.productId;
      if (!acc[prodId]) {
        acc[prodId] = [];
      }
      acc[prodId].push(price);
      return acc;
    }, {} as Record<string, typeof prices>);

    // Aplanar lista pero ordenada por producto y luego por precio
    const sortedPrices: typeof prices = [];
    
    Object.values(groupedByProduct).forEach(group => {
      // Ordenar proveedores dentro del producto: SellPrice ASC, luego CostPrice ASC
      // Treat undefined/null displayPrice as Infinity so it sorts last
      group.sort((a, b) => {
        const sellA = a.sellPrice != null ? Number(a.sellPrice) : null;
        const costA = a.costPrice != null ? Number(a.costPrice) : null;
        const priceA = sellA !== null ? sellA : (costA !== null ? costA : Infinity);

        const sellB = b.sellPrice != null ? Number(b.sellPrice) : null;
        const costB = b.costPrice != null ? Number(b.costPrice) : null;
        const priceB = sellB !== null ? sellB : (costB !== null ? costB : Infinity);

        return priceA - priceB;
      });
      sortedPrices.push(...group);
    });

    // 5. Mapeo final con priceType explícito (MUST 3 / AJUSTE 1)
    const items = sortedPrices.flatMap((p) => {
      const sellPrice = p.sellPrice != null ? Number(p.sellPrice) : null;
      const costPrice = p.costPrice != null ? Number(p.costPrice) : null;

      // Skip records where both prices are null
      if (sellPrice === null && costPrice === null) {
        return [];
      }

      // Lógica de displayPrice
      let displayPrice: number | undefined;
      let displayPriceType: 'sell' | 'cost' = 'cost';

      if (sellPrice !== null) {
        displayPrice = sellPrice;
        displayPriceType = 'sell';
      } else if (costPrice !== null) {
        displayPrice = costPrice;
      }

      return [{
        productId: p.productId,
        productName: p.product.name,
        productNameEs: p.product.nameEs, // Útil para respuestas en español
        supplierId: p.supplierId,
        supplierName: p.supplier.name,
        costPrice: costPrice,
        sellPrice: sellPrice,
        displayPrice: displayPrice,
        displayPriceType: displayPriceType,
        currency: p.currency,
        effectiveDate: p.effectiveDate != null ? p.effectiveDate.toISOString() : undefined,
      }];
    });

    const sources: ChatSource[] = sortedPrices.map((p) => ({
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
