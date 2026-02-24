import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import prisma from '@/lib/db';
import { createApiKey } from '@/lib/services/bot/api-key.service';

describe('POST /api/v1/bot/query', () => {
  let validApiKey: string;
  let testCustomer: any;
  let testInvoice: any;

  beforeEach(async () => {
    // Limpiar datos de prueba
    await prisma.invoice.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.botApiKey.deleteMany();

    // Crear API key de prueba
    validApiKey = await createApiKey({ 
      name: 'test-bot-key', 
      rateLimit: 10 
    });

    // Crear datos de prueba
    testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        taxId: 'TEST123456',
        email: 'test@example.com',
        isActive: true,
      },
    });

    testInvoice = await prisma.invoice.create({
      data: {
        number: 'F-2024-001',
        customerId: testCustomer.id,
        status: 'PENDING',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 100.00,
        taxRate: 0.13,
        taxAmount: 13.00,
        total: 113.00,
      },
    });
  });

  afterEach(async () => {
    await prisma.invoice.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.botApiKey.deleteMany();
  });

  describe('Autenticación y autorización', () => {
    it('debe rechazar solicitudes sin API key', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'What are my pending invoices?',
          language: 'en',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar API keys inválidas', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': 'invalid-api-key-12345',
        },
        body: JSON.stringify({
          query: 'What are my pending invoices?',
          language: 'en',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('debe aceptar API keys válidas', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'What are my pending invoices?',
          language: 'en',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  describe('Validación de payload', () => {
    it('debe rechazar payload JSON inválido', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: 'invalid json {',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar consultas vacías', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: '',
          language: 'en',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar lenguajes no soportados', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'Test query',
          language: 'fr', // Francés no soportado
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe aceptar payload válido mínimo', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'Help me',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('debe aceptar payload completo válido', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'What are my pending invoices?',
          language: 'en',
          context: {
            customerId: testCustomer.id,
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.intent).toBeDefined();
      expect(data.data.confidence).toBeDefined();
      expect(data.data.response).toBeDefined();
      expect(data.data.sources).toBeDefined();
    });
  });

  describe('Procesamiento de consultas', () => {
    it('debe procesar consultas de ayuda', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'help',
          language: 'en',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.intent).toBe('help.query');
      expect(data.data.confidence).toBeGreaterThan(0.8);
      expect(data.data.response).toContain('I can help you');
    });

    it('debe procesar consultas de facturas', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'What are my pending invoices?',
          language: 'en',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.intent).toBe('invoice.query');
      expect(data.data.confidence).toBeGreaterThan(0.7);
      expect(data.data.sources.length).toBeGreaterThan(0);
    });

    it('debe procesar consultas específicas de facturas por número', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'Show me invoice F-2024-001',
          language: 'en',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.intent).toBe('invoice.query');
      expect(data.data.sources.length).toBeGreaterThan(0);
      expect(data.data.sources[0].name).toBe('F-2024-001');
    });

    it('debe procesar consultas de saldo', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'How much do I owe?',
          language: 'en',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.intent).toBe('balance.query');
      expect(data.data.confidence).toBeGreaterThan(0.8);
      expect(data.data.response).toContain('$113.00'); // Total de la factura de prueba
    });

    it('debe manejar consultas desconocidas', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'What is the meaning of life?',
          language: 'en',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.intent).toBe('unknown');
      expect(data.data.confidence).toBeLessThan(0.5);
      expect(data.data.response).toContain('did not understand');
    });
  });

  describe('Soporte multiidioma', () => {
    it('debe procesar consultas en español', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: '¿Cuáles son mis facturas pendientes?',
          language: 'es',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.response).toContain('Encontré'); // Respuesta en español
    });

    it('debe procesar consultas en inglés', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'List my pending invoices',
          language: 'en',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.response).toContain('I found'); // Respuesta en inglés
    });
  });

  describe('Rate limiting', () => {
    it('debe aplicar rate limiting después de exceder el límite', async () => {
      // Hacer 11 requests rápidamente (límite es 10)
      const promises = [];
      for (let i = 0; i < 11; i++) {
        promises.push(
          fetch('http://localhost:3000/api/v1/bot/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bot-API-Key': validApiKey,
            },
            body: JSON.stringify({
              query: 'Help me',
              language: 'en',
            }),
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // El último request debería ser rate limited
      const lastResponse = responses[10];
      expect(lastResponse.status).toBe(429);
      
      const data = await lastResponse.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_LIMITED');
      
      // Verificar que el header Retry-After esté presente
      expect(lastResponse.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('Health check', () => {
    it('debe responder al endpoint GET con información del servicio', async () => {
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.version).toBe('1.0.0');
      expect(data.data.endpoints).toContain('POST /api/v1/bot/query');
    });
  });

  describe('Contexto de cliente', () => {
    it('debe filtrar resultados por customerId en contexto', async () => {
      // Crear un segundo cliente y factura
      const otherCustomer = await prisma.customer.create({
        data: {
          name: 'Other Customer',
          taxId: 'OTHER789',
          email: 'other@example.com',
          isActive: true,
        },
      });

      await prisma.invoice.create({
        data: {
          number: 'F-2024-002',
          customerId: otherCustomer.id,
          status: 'PENDING',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: 200.00,
          taxRate: 0.13,
          taxAmount: 26.00,
          total: 226.00,
        },
      });

      // Consultar con contexto de primer cliente
      const response = await fetch('http://localhost:3000/api/v1/bot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Key': validApiKey,
        },
        body: JSON.stringify({
          query: 'Show me my pending invoices',
          language: 'en',
          context: {
            customerId: testCustomer.id,
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.sources.length).toBe(1); // Solo debería encontrar la factura del cliente especificado
      expect(data.data.sources[0].name).toBe('F-2024-001');
    });
  });
});
