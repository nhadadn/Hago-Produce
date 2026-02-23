import prisma from '@/lib/db';
import { ChatLanguage, ChatSource, QueryExecutionResult } from '@/lib/chat/types';

export async function inventorySummaryIntent(
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
): Promise<QueryExecutionResult> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      prices: {
        some: {
          isCurrent: true,
        },
      },
    },
    include: {
      prices: {
        where: { isCurrent: true },
      },
    },
  });

  const byCategory = new Map<
    string,
    {
      category: string;
      products: {
        id: string;
        name: string;
        minPrice: number | null;
        maxPrice: number | null;
      }[];
    }
  >();

  for (const p of products) {
    const categoryKey = p.category || 'Uncategorized';
    const existing =
      byCategory.get(categoryKey) || ({ category: categoryKey, products: [] } as {
        category: string;
        products: { id: string; name: string; minPrice: number | null; maxPrice: number | null }[];
      });

    const prices = p.prices.map((pr) =>
      pr.sellPrice != null ? Number(pr.sellPrice) : Number(pr.costPrice),
    );
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;

    existing.products.push({
      id: p.id,
      name: p.name,
      minPrice,
      maxPrice,
    });

    byCategory.set(categoryKey, existing);
  }

  const items = Array.from(byCategory.values());

  const sources: ChatSource[] = products.slice(0, 20).map((p) => ({
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
    },
    sources,
  };
}

