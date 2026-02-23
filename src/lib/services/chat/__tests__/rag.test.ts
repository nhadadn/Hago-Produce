import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse } from '@/lib/services/chat/openai-client';
import { DetectedIntent, QueryExecutionResult } from '@/lib/chat/types';

jest.mock('@/lib/db', () => ({
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

const prisma = jest.requireMock('@/lib/db');

describe('RAG chat intents end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure OpenAI fallback is not used unless explicitly mocked
    delete process.env.OPENAI_API_KEY;
    (global as any).fetch = undefined;
  });

  it('detects price_lookup intent for "precio de piña" and returns items', async () => {
    (prisma.productPrice.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'pp-1',
        productId: 'p-1',
        supplierId: 's-1',
        costPrice: 10,
        sellPrice: 15,
        currency: 'MXN',
        effectiveDate: new Date('2024-01-01'),
        product: { id: 'p-1', name: 'Pineapple', nameEs: 'Piña' },
        supplier: { id: 's-1', name: 'Proveedor A' },
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
    (prisma.productPrice.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'pp-2',
        productId: 'p-2',
        supplierId: 's-2',
        costPrice: 8,
        sellPrice: 12,
        currency: 'MXN',
        effectiveDate: new Date('2024-01-01'),
        product: { id: 'p-2', name: 'Almonds', nameEs: 'Almendras' },
        supplier: { id: 's-2', name: 'Proveedor B' },
      },
    ]);

    const detected = await analyzeIntent('mejor proveedor de almendras', 'es');

    expect(detected.intent).toBe('best_supplier');

    const result = await executeQuery(detected, 'es');
    expect(result.intent).toBe('best_supplier');
    expect(result.data.items).toHaveLength(1);
  });

  it('detects product_info intent for "información del producto mango"', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'p-3',
        name: 'Mango',
        nameEs: 'Mango',
        category: 'Fruta',
        unit: 'kg',
        sku: 'MANGO-001',
        prices: [
          {
            id: 'pp-3',
            supplierId: 's-3',
            supplier: { id: 's-3', name: 'Proveedor C' },
            costPrice: 5,
            sellPrice: 9,
            currency: 'MXN',
            effectiveDate: new Date('2024-01-01'),
          },
        ],
      },
    ]);

    const detected = await analyzeIntent('información del producto mango', 'es');

    expect(detected.intent).toBe('product_info');

    const result = await executeQuery(detected, 'es');
    expect(result.intent).toBe('product_info');
    expect(result.data.items[0].nameEs).toBe('Mango');
  });

  it('detects overdue_invoices intent for "facturas vencidas"', async () => {
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
      intent: 'price_lookup',
      data: { items: [] },
      sources: [],
    };

    const historyMessages = [
      { role: 'user' as const, content: 'Hola' },
      { role: 'assistant' as const, content: 'Hola, ¿en qué te ayudo?' },
    ];

    await formatResponse('price_lookup', 'es', executionResult, [
      { role: 'system', content: 'Historial' },
      ...historyMessages,
      { role: 'user', content: 'precio de manzana' },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);

    expect(body.messages).toHaveLength(4);
    expect(body.messages[1].role).toBe('user');
    expect(body.messages[2].role).toBe('assistant');
  });
});

