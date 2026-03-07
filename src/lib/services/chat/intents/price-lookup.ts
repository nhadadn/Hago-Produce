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
          items: await runSingleLookup(term, prisma),
        }))
      );
      
      return {
        intent: 'price_lookup',
        confidence,
        language,
        data: {
          type: 'price_lookup_multi',
          queries: terms,
          results: multiResults,
        },
        sources: [],
      };
    }

    // Handle single term (backward compatible)
    const singleTerm = terms[0] || searchTerm;
    const items = await runSingleLookup(singleTerm, prisma);

    // Manejo de resultados vacíos: sugerencias
    if (items.length === 0) {
      const suggestions = await prisma.product.findMany({
        where: {
          isActive: true,
          name: { contains: singleTerm, mode: 'insensitive' },
        },
        select: { name: true },
        take: 3,
      });

      const suggestionList = suggestions.map(s => s.name);

      return {
        intent: 'price_lookup',
        confidence,
        language,
        data: {
          type: 'price_lookup',
          query: singleTerm,
          items: [],
          suggestions: suggestionList
        },
        sources: [],
      };
    }

    const sources: ChatSource[] = items.map((p, idx) => ({
      type: 'price_version',
      id: `lookup-${idx}`, // Synthetic ID since we don't return raw DB objects from helper
      label: `${p.productName} - ${p.supplierName}`,
    }));

    return {
      intent: 'price_lookup',
      confidence,
      language,
      data: {
        type: 'price_lookup',
        query: singleTerm,
        items,
      },
      sources,
    };
  } catch (error) {
    logger.error(`[PriceLookup] Error executing query: ${error}`);
    throw error;
  }
}

async function runSingleLookup(
  term: string,
  prismaClient: typeof prisma
): Promise<Array<{
  productName: string;
  nameEs: string | null;
  supplierName: string;
  costPrice: number;
  sellPrice: null;
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
      priceList: { isCurrent: true },
      price: { gt: 0 },
      product: productFilter,
    },
    include: {
      priceList: { include: { supplier: true } },
      product: true,
    },
    orderBy: { price: 'asc' },
    take: 10,
  });

  return prices.map(p => ({
    productName: p.product.name,
    nameEs: p.product.nameEs,
    supplierName: p.priceList.supplier.name,
    costPrice: Number(p.price),
    sellPrice: null,
    currency: p.currency,
    effectiveDate: p.validFrom.toISOString(),
  }));
}
