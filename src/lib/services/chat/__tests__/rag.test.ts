import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse } from '@/lib/services/chat/openai-client';
import { DetectedIntent, QueryExecutionResult } from '@/lib/chat/types';

jest.mock('@/lib/db', () => ({
  priceVersion: {
    findMany: jest.fn(),
  },
  productPrice: {
    findMany: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
}));

jest.mock('@/lib/services/chat/intents', () => ({
  analyzeIntent: jest.fn(),
}));

const prisma = jest.requireMock('@/lib/db');

describe('RAG chat intents end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure OpenAI fallback is not used unless explicitly mocked
    delete process.env.OPENAI_API_KEY;
    (global as any).fetch = undefined;
  });

  it('detects price_lookup intent for "precio de piña" and returns items', async () => {
    (analyzeIntent as jest.Mock).mockResolvedValue({
      intent: 'price_lookup',
      confidence: 0.9,
      params: { searchTerm: 'Pineapple' }
    });

    (prisma.priceVersion.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'pp-1',
        price: 10,
        currency: 'MXN',
        effectiveDate: new Date('2024-01-01'),
        product: { id: 'p-1', name: 'Pineapple', nameEs: 'Piña' },
        priceList: { supplier: { id: 's-1', name: 'Proveedor A' } },
        validFrom: new Date('2024-01-01'),
      },
    ]);

    const detected = await analyzeIntent('precio de piña', 'es');

    expect(detected.intent).toBe('price_lookup');

    const result = await executeQuery(detected, 'es');

    expect(result.intent).toBe('price_lookup');
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0].productName).toBe('Pineapple');
  });

  it('detects best_supplier intent for "mejor proveedor de almendras"', async () => {
    (analyzeIntent as jest.Mock).mockResolvedValue({
      intent: 'best_supplier',
      confidence: 0.9,
      params: { searchTerm: 'Almonds' }
    });

    (prisma.priceVersion.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'pp-2',
        price: 8,
        currency: 'MXN',
        effectiveDate: new Date('2024-01-01'),
        product: { id: 'p-2', name: 'Almonds', nameEs: 'Almendras' },
        priceList: { supplier: { id: 's-2', name: 'Proveedor B' } },
        validFrom: new Date('2024-01-01'),
      },
    ]);

    const detected = await analyzeIntent('mejor proveedor de almendras', 'es');

    expect(detected.intent).toBe('best_supplier');

    const result = await executeQuery(detected, 'es');
    expect(result.intent).toBe('best_supplier');
    expect(result.data.items).toHaveLength(1);
  });

  it('detects product_info intent for "información del producto mango"', async () => {
    (analyzeIntent as jest.Mock).mockResolvedValue({
      intent: 'product_info',
      confidence: 0.9,
      params: { productName: 'Mango' }
    });

    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'p-3',
        name: 'Mango',
        nameEs: 'Mango',
        category: 'Fruta',
        unit: 'kg',
        sku: 'MANGO-001',
        prices: [],
      },
    ]);

    const detected = await analyzeIntent('información del producto mango', 'es');

    expect(detected.intent).toBe('product_info');

    const result = await executeQuery(detected, 'es');
    expect(result.intent).toBe('product_info');
    expect(result.data.items[0].nameEs).toBe('Mango');
  });

  it('detects overdue_invoices intent for "facturas vencidas"', async () => {
    (analyzeIntent as jest.Mock).mockResolvedValue({
      intent: 'overdue_invoices',
      confidence: 0.9,
      params: {}
    });

    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'inv-1',
        number: 'INV-001',
        dueDate: new Date('2024-01-01'),
        total: 1000,
        customer: { id: 'c-1', name: 'Cliente 1' },
      },
    ]);

    const detected = await analyzeIntent('muéstrame las facturas vencidas', 'es');

    expect(detected.intent).toBe('overdue_invoices');

    const result = await executeQuery(detected, 'es');
    expect(result.intent).toBe('overdue_invoices');
    expect(result.data.items).toHaveLength(1);
  });

  it('includes conversation history in OpenAI prompt when formatting response', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Respuesta simulada',
            },
          },
        ],
      }),
    });

    (global as any).fetch = fetchMock;

    const executionResult: QueryExecutionResult = {
      intent: 'clarification_needed',
      data: { reply: 'Hola' },
      sources: [],
      confidence: 1,
      language: 'es',
    };

    const historyMessages = [
      { role: 'user' as const, content: 'Hola' },
      { role: 'assistant' as const, content: 'Hola, ¿en qué te ayudo?' },
    ];

    await formatResponse('clarification_needed', 'es', executionResult, [
      { role: 'system', content: 'Historial' },
      ...historyMessages,
      { role: 'user', content: 'Hola de nuevo' },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);

    expect(body.messages).toHaveLength(4);
    expect(body.messages[1].role).toBe('user');
    expect(body.messages[2].role).toBe('assistant');
  });
});

