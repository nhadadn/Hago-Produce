import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';
import { cleanSearchTerm } from '@/lib/services/chat/utils/text-utils';

export async function productInfoIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  // MUST 1: Priorizar params.productName y limpiar input
  const rawTerm = String(params.productName || params.searchTerm || '').trim();
  let searchTerm = cleanSearchTerm(rawTerm);

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
    // ------------------------------------------------------------------
    // QUERY 1: Búsqueda Principal (Exacta/Contains + Activos)
    // ------------------------------------------------------------------
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

    // Si encontramos productos activos, procesamos y retornamos
    if (products.length > 0) {
      const items = mapProductsToItems(products);
      const sources = mapProductsToSources(products);

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
    }

    // ------------------------------------------------------------------
    // QUERY 2: Check Inactivos (SHOULD 1)
    // Si no se encontró nada activo, buscamos sin el filtro isActive
    // ------------------------------------------------------------------
    const inactiveProducts = await prisma.product.findMany({
      where: {
        // Sin filtro isActive
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { nameEs: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: { name: true, nameEs: true, isActive: true }, // Solo necesitamos verificar existencia
      take: 1,
    });

    if (inactiveProducts.length > 0) {
      // Encontramos el producto pero está inactivo
      const p = inactiveProducts[0];
      const productName = language === 'en' ? p.name : (p.nameEs || p.name);
      
      return {
        intent: 'product_info',
        confidence,
        language,
        data: {
          type: 'product_info',
          query: searchTerm,
          items: [],
          message: language === 'en' 
            ? `The product "${productName}" exists in our catalog but is currently inactive.`
            : `El producto "${productName}" existe en nuestro catálogo pero está inactivo actualmente.`,
          productFound: true,
          isActive: false
        },
        sources: [],
      };
    }

    // ------------------------------------------------------------------
    // QUERY 3: Sugerencias Fuzzy (MUST 3 + AJUSTE)
    // Si no existe ni activo ni inactivo, intentamos buscar sugerencias
    // usando una versión truncada del término
    // ------------------------------------------------------------------
    const firstToken = searchTerm.split(' ')[0];
    const fuzzyTerm = firstToken.length >= 4 
      ? firstToken.substring(0, 4) 
      : firstToken;

    let suggestionsList: string[] = [];

    if (fuzzyTerm.length >= 3) {
      const suggestions = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: fuzzyTerm, mode: 'insensitive' } },
            { nameEs: { contains: fuzzyTerm, mode: 'insensitive' } },
          ],
        },
        select: { name: true, nameEs: true },
        take: 3,
      });

      suggestionsList = suggestions.map(s => language === 'en' ? s.name : (s.nameEs || s.name));
    }

    return {
      intent: 'product_info',
      confidence,
      language,
      data: {
        type: 'product_info',
        query: searchTerm,
        items: [],
        suggestions: suggestionsList
      },
      sources: [],
    };

  } catch (error) {
    logger.error(`[ProductInfo] Error executing query: ${error}`);
    throw error;
  }
}

// Helper para mapear productos a estructura de respuesta
function mapProductsToItems(products: any[]) {
  return products.map((p: any) => {
    // SHOULD 2 & 3: Estandarizar y ordenar precios
    const processedPrices = p.prices.map((pr: any) => {
      const costPrice = Number(pr.costPrice);
      const sellPrice = pr.sellPrice != null ? Number(pr.sellPrice) : null;
      
      // Lógica displayPrice (igual a price-lookup)
      let displayPrice = costPrice;
      let displayPriceType: 'sell' | 'cost' = 'cost';

      if (sellPrice !== null) {
        displayPrice = sellPrice;
        displayPriceType = 'sell';
      }

      return {
        id: pr.id,
        supplierId: pr.supplierId,
        supplierName: pr.supplier.name,
        costPrice,
        sellPrice,
        displayPrice,
        displayPriceType,
        currency: pr.currency,
        effectiveDate: pr.effectiveDate.toISOString(),
      };
    });

    // Ordenar por displayPrice ASC (más barato primero)
    processedPrices.sort((a: any, b: any) => a.displayPrice - b.displayPrice);

    return {
      productId: p.id,
      name: p.name,
      nameEs: p.nameEs,
      description: p.description || null, // MUST 2
      category: p.category,
      unit: p.unit,
      sku: p.sku,
      prices: processedPrices,
    };
  });
}

// Helper para fuentes
function mapProductsToSources(products: any[]): ChatSource[] {
  return products.map((p: any) => ({
    type: 'product_price', // Mantenemos el tipo para consistencia UI
    id: p.id,
    label: p.name,
  }));
}
