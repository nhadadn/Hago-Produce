import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';

export async function inventorySummaryIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  const category = params.category as string | null;
  const searchTerm = params.searchTerm as string | null;

  // Build filter conditions
  const where: any = {
    isActive: true,
  };

  if (category) {
    where.category = {
      contains: category,
      mode: 'insensitive',
    };
  } else if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { nameEs: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // MUST 1: Dynamic Filters & Pagination
  let products = await prisma.product.findMany({
    where,
    include: {
      prices: {
        where: { isCurrent: true },
        include: { supplier: true },
      },
    },
    take: 20,
    orderBy: [
        { category: 'asc' },
        { name: 'asc' }
    ],
  });

  // SHOULD 1: Suggest categories if empty result with category filter
  let suggestedCategories: string[] = [];
  if (products.length === 0 && category) {
      // Execute 2nd query (allowed max 2) to check available categories
      const categories = await prisma.product.findMany({
          where: { isActive: true, category: { not: null } },
          select: { category: true },
          distinct: ['category'],
          take: 5,
      });
      suggestedCategories = categories.map(c => c.category!).filter(Boolean);
  }

  // Process results in memory
  const byCategory = new Map<string, number>();
  
  const items = products.map(p => {
    // MUST 2: Response Fields
    // TODO: Migrate from deprecated ProductPrice to PriceVersion/PriceList
    const currentPrices = p.prices.map(pr => ({
        supplierName: pr.supplier.name,
        costPrice: Number(pr.costPrice),
        sellPrice: pr.sellPrice ? Number(pr.sellPrice) : null,
        currency: 'CAD', // Hardcoded per requirement
    }));

    // SHOULD 2: Lowest Price Calculation
    let lowestPrice: number | null = null;
    let lowestPriceSupplier: string | null = null;

    if (currentPrices.length === 0) {
        lowestPrice = null;
        lowestPriceSupplier = null;
    } else {
        // Find min costPrice
        const minPriceObj = currentPrices.reduce((prev, curr) =>
            prev.costPrice < curr.costPrice ? prev : curr
        );
        lowestPrice = minPriceObj.costPrice;
        lowestPriceSupplier = minPriceObj.supplierName;
    }

    // MUST 3: Category Summary counting
    const cat = p.category || 'Uncategorized';
    byCategory.set(cat, (byCategory.get(cat) || 0) + 1);

    return {
        id: p.id,
        name: p.name,
        nameEs: p.nameEs,
        category: p.category,
        unit: p.unit,
        sku: p.sku,
        currentPrices,
        lowestPrice,
        lowestPriceSupplier,
    };
  });

  // Build Summary Object
  const summary = {
      totalProducts: items.length,
      categories: Array.from(byCategory.entries()).map(([name, count]) => ({
          name,
          count
      })),
      suggestedCategories: suggestedCategories.length > 0 ? suggestedCategories : undefined
  };

  const sources: ChatSource[] = products.map((p) => ({
    type: 'product',
    id: p.id,
    label: p.name,
  }));

  return {
    intent: 'inventory_summary',
    confidence,
    language,
    data: {
      type: 'inventory_summary',
      items,
      summary,
      filters: {
          category: category || null,
          searchTerm: searchTerm || null
      }
    },
    sources,
  };
}
