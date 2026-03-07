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
    const rawTerms = Array.isArray(params.searchTerms)
      ? (params.searchTerms as string[])
      : [params.searchTerm as string];

    const terms = rawTerms
      .map(t => cleanSearchTerm(String(t || '')))
      .filter(t => t.length > 0);

    // Fallback if cleaning removed everything but we had a searchTerm
    if (terms.length === 0 && searchTerm) {
      terms.push(searchTerm);
    }

    // Handle multiple terms
    if (terms.length > 1) {
      const multiResults = await Promise.all(
        terms.map(async term => ({
          query: term,
          items: await runSingleBestSupplier(term, limit, prisma),
        }))
      );
      
      return {
        intent: 'best_supplier',
        confidence,
        language,
        data: {
          type: 'best_supplier_multi',
          queries: terms,
          results: multiResults,
        },
        sources: [],
      };
    }

    // Handle single term (backward compatible)
    const singleTerm = terms[0] || searchTerm;
    const items = await runSingleBestSupplier(singleTerm, limit, prisma);

    // Manejo de resultados vacíos: Búsqueda de sugerencias (MUST 1 fallback)
    if (items.length === 0) {
      const suggestions = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: singleTerm, mode: 'insensitive' } },
            { nameEs: { contains: singleTerm, mode: 'insensitive' } },
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
          query: singleTerm,
          items: [],
          suggestions: suggestionList
        },
        sources: [],
      };
    }

    const sources: ChatSource[] = items.map((p, idx) => ({
      type: 'price_version',
      id: `best-${idx}`,
      label: `${p.productName} - ${p.supplierName}`,
    }));

    return {
      intent: 'best_supplier',
      confidence,
      language,
      data: {
        type: 'best_supplier',
        query: singleTerm,
        items,
      },
      sources,
    };
  } catch (error) {
    logger.error(`[BestSupplier] Error fetching best suppliers: ${error}`);
    throw error;
  }
}

async function runSingleBestSupplier(
  term: string,
  limit: number,
  prismaClient: typeof prisma
): Promise<Array<{
  rank: number;
  productName: string;
  productNameEs: string | null;
  supplierName: string;
  costPrice: number;
  currency: string;
  effectiveDate: string;
}>> {
  const words = term.split(/\s+/).map(w => w.trim()).filter(w => w.length > 1);
  const buildWordFilter = (word: string) => ({
    OR: [
      { name: { equals: word, mode: 'insensitive' as const } },
      { name: { startsWith: word + ' ', mode: 'insensitive' as const } },
      { name: { contains: ' ' + word + ' ', mode: 'insensitive' as const } },
      { name: { endsWith: ' ' + word, mode: 'insensitive' as const } },
      { nameEs: { equals: word, mode: 'insensitive' as const } },
      { nameEs: { startsWith: word + ' ', mode: 'insensitive' as const } },
      { nameEs: { contains: ' ' + word + ' ', mode: 'insensitive' as const } },
      { nameEs: { endsWith: ' ' + word, mode: 'insensitive' as const } },
    ],
  });
  const productFilter = words.length <= 1
    ? buildWordFilter(words[0] ?? term)
    : { AND: words.map(buildWordFilter) };

  const prices = await prismaClient.priceVersion.findMany({
    where: {
      priceList: {
        isCurrent: true,
      },
      price: {
        gt: 0,
      },
      product: productFilter,
    },
    include: {
      priceList: {
        include: { supplier: true },
      },
      product: true,
    },
    orderBy: { price: 'asc' },
    take: limit,
  });

  const sorted = [...prices].sort((a, b) => Number(a.price) - Number(b.price));

  return sorted.map((p, index) => ({
    rank: index + 1,
    productName: p.product.name,
    productNameEs: p.product.nameEs,
    supplierName: p.priceList.supplier.name,
    costPrice: Number(p.price),
    currency: p.currency,
    effectiveDate: p.validFrom.toISOString(),
  }));
}
