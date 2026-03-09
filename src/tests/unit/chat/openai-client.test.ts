import { classifyChatIntentWithOpenAI, formatResponse } from '@/lib/services/chat/openai-client';
import { ChatIntent, ChatLanguage } from '@/lib/chat/types';

// Unmock the client to test real implementation
jest.unmock('@/lib/services/chat/openai-client');

// Mock logger
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('OpenAI Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (global.fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('classifyChatIntentWithOpenAI', () => {
    it('should return fallback if no API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await classifyChatIntentWithOpenAI('some message', 'en');

      expect(result).toEqual({
        intent: 'clarification_needed',
        confidence: 0.0,
        params: {
          question: 'Could you please rephrase? I am experiencing technical difficulties.',
          candidates: []
        },
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call OpenAI API and return parsed intent', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                intent: 'product_info',
                params: { productName: 'apple' },
              }),
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await classifyChatIntentWithOpenAI('tell me about apple', 'en');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        intent: 'product_info',
        confidence: 0.9,
        params: {
          productName: 'apple',
          rawMessage: 'tell me about apple',
        },
      });
    });

    it('should return fallback on API error', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const result = await classifyChatIntentWithOpenAI('message', 'en');

      expect(result.intent).toBe('price_lookup');
      expect(result.confidence).toBe(0.5);
    });

    it('should return fallback on fetch exception', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await classifyChatIntentWithOpenAI('message', 'en');

      expect(result.intent).toBe('price_lookup');
      expect(result.confidence).toBe(0.5);
    });

    it('should return fallback if response content is empty', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await classifyChatIntentWithOpenAI('message', 'en');

      expect(result.intent).toBe('price_lookup');
    });

    it('should handle spanish language correctly', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ intent: 'price_lookup' }) } }],
        }),
      });

      await classifyChatIntentWithOpenAI('mensaje', 'es');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      const systemMessage = body.messages.find((m: any) => m.role === 'system');
      
      expect(systemMessage.content).toContain('Eres el asistente del chat');
    });
  });

  describe('formatResponse', () => {
    const mockExecutionResult = {
      data: { some: 'data' },
      success: true,
    };

    it('should use fallback if no API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await formatResponse('price_lookup', 'en', mockExecutionResult);

      // Fallback for price_lookup with no items
      expect(result).toBe("No prices found for '' in our current price list.");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call OpenAI API and return content', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is the AI response',
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await formatResponse('price_lookup', 'en', mockExecutionResult);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toBe('This is the AI response');
    });

    it('should use correct system prompt for spanish', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Respuesta' } }] }),
      });

      await formatResponse('price_lookup', 'es', mockExecutionResult);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      const systemMessage = body.messages.find((m: any) => m.role === 'system');
      
      expect(systemMessage.content).toContain('Eres el asistente de HAGO PRODUCE');
    });

    it('should use fallback format when OpenAI API returns non-ok status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ error: 'Server Error' }),
      });

      const result = await formatResponse('customer_balance', 'es', { data: { totalOutstanding: 100, invoicesCount: 5 } });
      expect(result).toContain('Hay 5 facturas pendientes con un saldo total de 100'); // Fallback format
    });

    it('should use fallback format when OpenAI API throws an error', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await formatResponse('price_lookup', 'en', mockExecutionResult);

      expect(result).toBe("No prices found for '' in our current price list.");
    });

    it('should use fallback if response content is empty', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await formatResponse('price_lookup', 'en', mockExecutionResult);

      expect(result).toBe("No prices found for '' in our current price list.");
    });
  });

  describe('fallbackFormat logic', () => {
    // Testing fallback logic via formatResponse with no API key

    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    it('price_lookup: should return items list', async () => {
      const result = await formatResponse('price_lookup', 'en', {
        success: true,
        data: {
          query: 'Apple',
          items: [
            { productName: 'Apple', supplierName: 'SupA', costPrice: 10, currency: 'USD', effectiveDate: '2024-01-01' },
          ],
        },
      });
      expect(result).toContain('Prices for Apple');
      expect(result).toContain('#1  Apple  ·  SupA  ·  $10.00 USD');
    });

    it('price_lookup: should handle no items', async () => {
      const result = await formatResponse('price_lookup', 'en', {
        success: true,
        data: { items: [] },
      });
      expect(result).toBe("No prices found for '' in our current price list.");
    });

    it('price_lookup: should handle no items in spanish', async () => {
      const result = await formatResponse('price_lookup', 'es', {
        success: true,
        data: { items: [] },
      });
      expect(result).toBe("No encontré precios para '' en nuestra lista de precios actual.");
    });

    it('price_lookup: should handle spanish', async () => {
      const result = await formatResponse('price_lookup', 'es', {
        success: true,
        data: {
          query: 'Manzana',
          items: [
            { productName: 'Manzana', supplierName: 'SupA', costPrice: 10, currency: 'USD', effectiveDate: '2024-01-01' },
          ],
        },
      });
      expect(result).toContain('Precios para Manzana');
      expect(result).toContain('#1  Manzana  ·  SupA  ·  $10.00 USD');
    });

    it('best_supplier: should return best supplier', async () => {
      const result = await formatResponse('best_supplier', 'en', {
        success: true,
        data: {
          query: 'Apple',
          items: [
            { rank: 1, productName: 'Apple', supplierName: 'SupA', costPrice: 5, currency: 'USD', effectiveDate: '2024-01-01' },
          ],
        },
      });
      expect(result).toContain('Best prices for Apple');
      expect(result).toContain('#1  Apple  ·  SupA  ·  $5.00 USD');
    });

    it('best_supplier: should return best supplier in spanish', async () => {
      const result = await formatResponse('best_supplier', 'es', {
        success: true,
        data: {
          query: 'Manzana',
          items: [
            { rank: 1, productName: 'Manzana', supplierName: 'SupA', costPrice: 5, currency: 'USD', effectiveDate: '2024-01-01' },
          ],
        },
      });
      expect(result).toContain('Mejores precios para Manzana');
      expect(result).toContain('#1  Manzana  ·  SupA  ·  $5.00 USD');
    });

    it('best_supplier: should handle no items', async () => {
      const result = await formatResponse('best_supplier', 'en', {
        success: true,
        data: { items: [] },
      });
      expect(result).toContain("No suppliers found for '' in our current price list.");
    });

    it('best_supplier: should handle no items in spanish', async () => {
      const result = await formatResponse('best_supplier', 'es', {
        success: true,
        data: { items: [] },
      });
      expect(result).toContain("No encontré proveedores para '' en nuestra lista de precios actual.");
    });

    it('invoice_status: should return status', async () => {
      const result = await formatResponse('invoice_status', 'en', {
        success: true,
        data: {
          invoice: { number: 'INV-001', customer: { name: 'CustA' }, status: 'PAID', total: 100 },
        },
      });
      expect(result).toContain('Invoice INV-001 for customer CustA is PAID');
    });

    it('invoice_status: should return status in spanish', async () => {
      const result = await formatResponse('invoice_status', 'es', {
        success: true,
        data: {
          invoice: { number: 'INV-001', customer: { name: 'CustA' }, status: 'PAID', total: 100 },
        },
      });
      expect(result).toContain('La factura INV-001 del cliente CustA está en estado PAID');
    });

    it('invoice_status: should handle not found', async () => {
      const result = await formatResponse('invoice_status', 'en', {
        success: true,
        data: { invoice: null },
      });
      expect(result).toContain('Invoice not found');
    });

    it('invoice_status: should handle not found in spanish', async () => {
      const result = await formatResponse('invoice_status', 'es', {
        success: true,
        data: { invoice: null },
      });
      expect(result).toContain('No se encontró la factura solicitada');
    });

    it('customer_balance: should return balance', async () => {
      const result = await formatResponse('customer_balance', 'en', {
        success: true,
        data: {
          totalOutstanding: 500,
          invoicesCount: 5,
        },
      });
      expect(result).toContain('There are 5 pending invoices with a total outstanding balance of 500');
    });

    it('customer_balance: should return balance in spanish', async () => {
      const result = await formatResponse('customer_balance', 'es', {
        success: true,
        data: {
          totalOutstanding: 500,
          invoicesCount: 5,
        },
      });
      expect(result).toContain('Hay 5 facturas pendientes con un saldo total de 500');
    });

    it('unknown intent: should return generic message', async () => {
      const result = await formatResponse('create_order', 'en', {
        success: true,
        data: {},
      });
      expect(result).toBe('I processed your request.');
    });

    it('unknown intent: should return generic message in spanish', async () => {
      const result = await formatResponse('create_order', 'es', {
        success: true,
        data: {},
      });
      expect(result).toBe('He procesado tu solicitud.');
    });
  });
});
