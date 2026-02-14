import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/invoices/route';
import { GET as GET_ID, PUT } from '@/app/api/v1/invoices/[id]/route';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { InvoiceStatus, Role } from '@prisma/client';

// Mock DB
jest.mock('@/lib/db', () => {
  const mockPrisma = {
    invoice: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    invoiceItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

// Import prisma to access the mocks
import prisma from '@/lib/db';

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 }),
}));

describe('Invoices API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /invoices', () => {
    it('should create invoice with correct calculations', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      
      // Mock generateInvoiceNumber logic (findFirst)
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(null); // No previous invoice

      // Mock create
      const mockCreatedInvoice = {
        id: '1',
        number: 'INV-2026-0001',
        total: 113.00
      };
      (prisma.invoice.create as jest.Mock).mockResolvedValue(mockCreatedInvoice);

      const payload = {
        customerId: 'cust-1',
        issueDate: '2026-02-14',
        dueDate: '2026-03-14',
        items: [
          { productId: 'prod-1', quantity: 10, unitPrice: 10 } // 100 subtotal
        ]
      };

      const req = new NextRequest('http://localhost/api/v1/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          number: expect.stringMatching(/INV-\d{4}-\d{4}/),
          subtotal: 100,
          taxAmount: 13,
          total: 113
        })
      }));
    });

    it('should generate sequential invoice numbers', async () => {
       (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
       
       // Mock existing invoice
       (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({ number: 'INV-2026-0042' });
       (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: '2' });

       const payload = {
        customerId: 'cust-1',
        issueDate: '2026-02-14',
        dueDate: '2026-03-14',
        items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }]
      };

      const req = new NextRequest('http://localhost/api/v1/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await POST(req);

      expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          number: 'INV-2026-0043'
        })
      }));
    });
  });

  describe('GET /invoices', () => {
      it('should return paginated list', async () => {
          (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
          (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
          (prisma.invoice.count as jest.Mock).mockResolvedValue(0);

          const req = new NextRequest('http://localhost/api/v1/invoices?page=1&limit=10');
          const res = await GET(req);
          const body = await res.json();

          expect(res.status).toBe(200);
          expect(body.data.meta.page).toBe(1);
      });
  });

  describe('PUT /invoices/:id', () => {
      it('should update draft invoice', async () => {
          (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
          
          // Mock findUnique (existing invoice)
          (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ 
              id: '1', 
              status: InvoiceStatus.DRAFT,
              subtotal: 100,
              taxRate: 0.13
          });

          // Mock update
          (prisma.invoice.update as jest.Mock).mockResolvedValue({ id: '1', total: 226 });

          const payload = {
              items: [{ productId: 'p1', quantity: 20, unitPrice: 10 }] // 200 subtotal
          };

          const req = new NextRequest('http://localhost/api/v1/invoices/1', {
              method: 'PUT',
              body: JSON.stringify(payload),
          });
          
          const res = await PUT(req, { params: { id: '1' } });
          
          expect(res.status).toBe(200);
          expect(prisma.invoiceItem.deleteMany).toHaveBeenCalled();
          expect(prisma.invoiceItem.createMany).toHaveBeenCalled();
          expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
              where: { id: '1' },
              data: expect.objectContaining({
                  subtotal: 200,
                  total: 226
              })
          }));
      });

      it('should fail if invoice is not DRAFT', async () => {
          (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
          
          (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ 
              id: '1', 
              status: InvoiceStatus.PAID 
          });

          const req = new NextRequest('http://localhost/api/v1/invoices/1', {
              method: 'PUT',
              body: JSON.stringify({ notes: 'Updated' }),
          });
          
          const res = await PUT(req, { params: { id: '1' } });
          const body = await res.json();
          
          expect(res.status).toBe(400);
          expect(body.error.message).toContain('Only draft');
      });
  });
});
