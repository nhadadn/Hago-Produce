import { formatResponse } from '@/lib/services/chat/openai-client';
import { QueryExecutionResult } from '@/lib/chat/types';

describe('chat formatResponse', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = '';
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it('falls back to local formatting when no API key', async () => {
    const executionResult: QueryExecutionResult = {
      intent: 'price_lookup',
      confidence: 0.9,
      language: 'es',
      data: {
        type: 'price_lookup',
        query: 'manzana',
        items: [
          {
            productId: 'p-1',
            productName: 'Manzana',
            supplierId: 's-1',
            supplierName: 'Proveedor 1',
            costPrice: 10,
            sellPrice: 12,
            currency: 'USD',
            effectiveDate: new Date('2024-01-01').toISOString(),
          },
        ],
      },
      sources: [],
    };

    const text = await formatResponse('price_lookup', 'es', executionResult);
    expect(text).toContain('Manzana');
  });
});

