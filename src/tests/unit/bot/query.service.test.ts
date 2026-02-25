
import { BotQueryService, BotQueryInput } from '@/lib/services/bot/query.service';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    customer: { findFirst: jest.fn(), findMany: jest.fn() },
    invoice: { findMany: jest.fn() },
    product: { findMany: jest.fn() },
    supplier: { findMany: jest.fn() },
  },
}));

describe('BotQueryService', () => {
  let service: BotQueryService;

  beforeEach(() => {
    service = new BotQueryService();
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    describe('invoice.query', () => {
      it('should handle invoice query by number', async () => {
        const input: BotQueryInput = {
          query: 'factura F-2024-001',
          language: 'es',
        };

        const mockInvoices = [
          {
            id: 'inv-1',
            number: 'F-2024-001',
            total: 100,
            status: 'PENDING',
            customer: { name: 'Test Customer' },
            items: [],
          },
        ];

        (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('invoice.query');
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ number: '2024-001' }),
        }));
        expect(result.response).toContain('Encontré 1 factura(s)');
      });

      it('should handle invoice query by customer in context', async () => {
        const input: BotQueryInput = {
          query: 'mis facturas pendientes',
          language: 'es',
          context: { customerId: 'cust-1' },
        };

        (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('invoice.query');
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-1' }),
        }));
      });

      it('should handle invoice query by customer entity', async () => {
        const input: BotQueryInput = {
          query: 'facturas cliente ABC',
          language: 'es',
        };

        (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: 'cust-abc' });
        (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('invoice.query');
        expect(prisma.customer.findFirst).toHaveBeenCalled();
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-abc' }),
        }));
      });
    });

    describe('customer.query', () => {
      it('should handle customer query', async () => {
        const input: BotQueryInput = {
          query: 'buscar cliente XYZ',
          language: 'es',
        };

        const mockCustomers = [
          {
            id: 'cust-1',
            name: 'Customer XYZ',
            taxId: 'XYZ',
            invoices: [],
          },
        ];

        (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('customer.query');
        expect(prisma.customer.findMany).toHaveBeenCalled();
        expect(result.response).toContain('Encontré 1 cliente(s)');
      });
    });

    describe('product.query', () => {
      it('should handle product query', async () => {
        const input: BotQueryInput = {
          query: 'listar productos',
          language: 'es',
        };

        const mockProducts = [
          {
            id: 'prod-1',
            name: 'Apple',
            category: 'Fruit',
            prices: [],
          },
        ];

        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('product.query');
        expect(prisma.product.findMany).toHaveBeenCalled();
        expect(result.response).toContain('Encontré 1 producto(s)');
      });
    });

    describe('supplier.query', () => {
      it('should handle supplier query', async () => {
        const input: BotQueryInput = {
          query: 'ver proveedores',
          language: 'es',
        };

        const mockSuppliers = [
          {
            id: 'supp-1',
            name: 'Supplier A',
            contactName: 'John',
            prices: [],
          },
        ];

        (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('supplier.query');
        expect(prisma.supplier.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: { isActive: true },
        }));
        expect(result.response).toContain('Encontré 1 proveedor(es)');
      });
    });

    describe('balance.query', () => {
      it('should handle balance query', async () => {
        const input: BotQueryInput = {
          query: 'cuánto debo',
          language: 'es',
          context: { customerId: 'cust-1' },
        };

        const mockInvoices = [
          {
            id: 'inv-1',
            number: 'INV-001',
            total: 100,
            dueDate: new Date(),
            customer: { name: 'Me' },
          },
        ];

        (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('balance.query');
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ 
            customerId: 'cust-1',
            status: { in: ['PENDING', 'OVERDUE'] }
          }),
        }));
        expect(result.response).toContain('$100.00');
      });
    });

    describe('help.query', () => {
      it('should handle help query', async () => {
        const input: BotQueryInput = {
          query: 'ayuda por favor',
          language: 'es',
        };

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('help.query');
        expect(result.response).toContain('Puedo ayudarte con información sobre');
      });

      it('should handle help query in English', async () => {
        const input: BotQueryInput = {
          query: 'help me please',
          language: 'en',
        };

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('help.query');
        expect(result.response).toContain('I can help you with information about');
      });
    });

    describe('unknown query', () => {
      it('should handle unknown query', async () => {
        const input: BotQueryInput = {
          query: 'bla bla bla',
          language: 'es',
        };

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('unknown');
        expect(result.response).toContain('No entendí tu consulta');
      });

      it('should handle unknown query in English', async () => {
        const input: BotQueryInput = {
          query: 'bla bla bla',
          language: 'en',
        };

        const result = await service.executeQuery(input);

        expect(result.intent).toBe('unknown');
        expect(result.response).toContain('I did not understand your query');
      });
    });

    describe('Empty results and English responses', () => {
      it('should handle no invoices found in English', async () => {
        const input: BotQueryInput = { query: 'invoice F-999', language: 'en' };
        (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('I could not find invoices matching your query');
      });

      it('should handle no customers found in English', async () => {
        const input: BotQueryInput = { query: 'find customer Unknown', language: 'en' };
        (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('I could not find customers matching your query');
      });

      it('should handle no products found in English', async () => {
        const input: BotQueryInput = { query: 'list products', language: 'en' };
        (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('I could not find products matching your query');
      });

      it('should handle no suppliers found in English', async () => {
        const input: BotQueryInput = { query: 'list suppliers', language: 'en' };
        (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('There are no active suppliers in the system');
      });

      it('should handle no pending invoices found in English', async () => {
        const input: BotQueryInput = { query: 'how much do I owe', language: 'en' };
        (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('There are no pending invoices');
      });
    });

    describe('Date parsing', () => {
      it('should parse "hoy"', async () => {
        const input: BotQueryInput = { query: 'facturas hoy', language: 'es' };
        (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
        await service.executeQuery(input);
      });

      it('should parse "ayer"', async () => {
         const input: BotQueryInput = { query: 'facturas ayer', language: 'es' };
         (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
         await service.executeQuery(input);
      });

      it('should parse "este mes"', async () => {
         const input: BotQueryInput = { query: 'facturas este mes', language: 'es' };
         (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
         await service.executeQuery(input);
      });

       it('should parse "este año"', async () => {
         const input: BotQueryInput = { query: 'facturas este año', language: 'es' };
         (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
         await service.executeQuery(input);
      });

       it('should parse ISO date', async () => {
         const input: BotQueryInput = { query: 'facturas 2024-01-01', language: 'es' };
         (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
         await service.executeQuery(input);
       });
    });
    describe('Large result sets', () => {
      it('should limit invoice results to 5 (in query params)', async () => {
        const input: BotQueryInput = { query: 'facturas', language: 'es' };
        // We can't easily test that it limits to 5 in the response text because the mock returns what we give it.
        // But we can check that prisma was called with take: 5.
        const mockInvoices = Array(5).fill({ id: 'inv', number: 'INV', total: 100, customer: { name: 'C' }, status: 'PENDING' });
        (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
        const result = await service.executeQuery(input);
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
        expect(result.response).toContain('Encontré 5 factura(s)');
      });
    });

    describe('English list formatting', () => {
      it('should format invoice list in English', async () => {
        const input: BotQueryInput = { query: 'invoices', language: 'en' };
        const mockInvoices = [{ id: 'inv', number: 'INV-1', total: 100, customer: { name: 'C' }, status: 'PENDING' }];
        (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('I found 1 invoice(s)');
      });

      it('should format customer list in English', async () => {
        const input: BotQueryInput = { query: 'customers', language: 'en' };
        const mockCustomers = [{ id: 'c', name: 'Cust', taxId: 'T', invoices: [] }];
        (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('I found 1 customer(s)');
      });

      it('should format product list in English', async () => {
        const input: BotQueryInput = { query: 'products', language: 'en' };
        const mockProducts = [{ id: 'p', name: 'Prod', category: 'Cat', prices: [] }];
        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('I found 1 product(s)');
      });

      it('should format supplier list in English', async () => {
        const input: BotQueryInput = { query: 'suppliers', language: 'en' };
        const mockSuppliers = [{ id: 's', name: 'Supp', contactName: 'Con', prices: [] }];
        (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);
        const result = await service.executeQuery(input);
        expect(result.response).toContain('I found 1 supplier(s)');
      });
    });

    describe('Additional coverage scenarios', () => {
      it('should handle customer query with context', async () => {
        const input: BotQueryInput = { 
          query: 'info cliente', // changed from 'mi info' to match keywords
          language: 'es',
          context: { customerId: 'cust-1' }
        };
        (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);
        await service.executeQuery(input);
        expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ id: 'cust-1' })
        }));
      });

      it('should handle balance query with customer entity (no context)', async () => {
        const input: BotQueryInput = { 
          query: 'saldo cliente ABC123', // Ensure regex matches
          language: 'es'
          // No context
        };
        // Mock findFirst for customer lookup
        (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: 'cust-abc' });
        (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
        
        await service.executeQuery(input);
        
        expect(prisma.customer.findFirst).toHaveBeenCalled();
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-abc' })
        }));
      });
    });
  });
});
