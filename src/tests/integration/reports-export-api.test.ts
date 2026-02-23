import { NextRequest } from 'next/server';
import { POST as EXPORT_PDF } from '@/app/api/v1/reports/export/pdf/route';
import { POST as EXPORT_CSV } from '@/app/api/v1/reports/export/csv/route';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: () =>
    new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), {
      status: 401,
    }),
}));

jest.mock('@/lib/db', () => {
  const mockPrisma = {
    invoice: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
    invoiceItem: {
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    productPrice: {
      findMany: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('Reports Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /reports/export/pdf', () => {
    it('should return PDF for revenue report', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.MANAGEMENT,
      });

      (prisma.invoice.aggregate as jest.Mock)
        .mockResolvedValueOnce({
          _sum: { total: 300 },
          _avg: { total: 100 },
        })
        .mockResolvedValueOnce({
          _sum: { total: 150 },
        });

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        { total: 100, issueDate: new Date('2024-01-05') },
        { total: 200, issueDate: new Date('2024-01-15') },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'revenue',
          filters: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        }),
      });

      const res = await EXPORT_PDF(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="revenue-report-\d{4}-\d{2}-\d{2}\.pdf"/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should return PDF for aging report', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.ADMIN,
      });

      const asOfDate = new Date('2024-02-01T00:00:00Z');

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        {
          total: 100,
          dueDate: new Date('2024-01-25T00:00:00Z'),
        },
        {
          total: 200,
          dueDate: new Date('2023-12-15T00:00:00Z'),
        },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'aging',
          filters: {
            asOfDate: asOfDate.toISOString(),
          },
        }),
      });

      const res = await EXPORT_PDF(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="aging-report-\d{4}-\d{2}-\d{2}\.pdf"/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should return PDF for top customers report', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.ACCOUNTING,
      });

      (prisma.invoice.groupBy as jest.Mock).mockResolvedValue([
        {
          customerId: 'cust-1',
          _sum: { total: 300 },
          _count: { id: 3 },
        },
      ]);

      (prisma.customer.findMany as jest.Mock).mockResolvedValue([
        { id: 'cust-1', name: 'Customer 1' },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'top-customers',
          filters: {},
        }),
      });

      const res = await EXPORT_PDF(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="top-customers-report-\d{4}-\d{2}-\d{2}\.pdf"/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should return PDF for top products report', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.MANAGEMENT,
      });

      (prisma.invoiceItem.groupBy as jest.Mock).mockResolvedValue([
        {
          productId: 'prod-1',
          _sum: { quantity: 10, totalPrice: 500 },
        },
      ]);

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod-1', name: 'Product 1' },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'top-products',
          filters: {},
        }),
      });

      const res = await EXPORT_PDF(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="top-products-report-\d{4}-\d{2}-\d{2}\.pdf"/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should return PDF for price trends report', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.ADMIN,
      });

      (prisma.productPrice.findMany as jest.Mock).mockResolvedValue([
        {
          productId: 'prod-1',
          supplierId: 'sup-1',
          costPrice: 10,
          sellPrice: 20,
          currency: 'USD',
          effectiveDate: new Date('2024-01-10T00:00:00Z'),
          isCurrent: true,
          source: 'manual',
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'sup-1',
            name: 'Supplier 1',
          },
        },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'price-trends',
          filters: {
            productId: 'prod-1',
            months: 3,
          },
        }),
      });

      const res = await EXPORT_PDF(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="price-trends-report-\d{4}-\d{2}-\d{2}\.pdf"/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should return 403 for unauthorized role', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.CUSTOMER,
      });

      const req = new NextRequest('http://localhost/api/v1/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'revenue',
          filters: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        }),
      });

      const res = await EXPORT_PDF(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for invalid validation', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.MANAGEMENT,
      });

      const req = new NextRequest('http://localhost/api/v1/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'revenue',
          filters: {
            startDate: 'invalid-date',
            endDate: '2024-01-31',
          },
        }),
      });

      const res = await EXPORT_PDF(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /reports/export/csv', () => {
    it('should return CSV for revenue report', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.MANAGEMENT,
      });

      (prisma.invoice.aggregate as jest.Mock)
        .mockResolvedValueOnce({
          _sum: { total: 300 },
          _avg: { total: 100 },
        })
        .mockResolvedValueOnce({
          _sum: { total: 150 },
        });

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        { total: 100, issueDate: new Date('2024-01-05') },
        { total: 200, issueDate: new Date('2024-01-15') },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'revenue',
          filters: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        }),
      });

      const res = await EXPORT_CSV(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="revenue-report-\d{4}-\d{2}-\d{2}\.csv"/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);

      const csv = Buffer.from(buffer).toString('utf8');
      expect(csv).toContain('Total de Ingresos');
      expect(csv).toContain('300.00');
      expect(csv).toContain('Mes');
      expect(csv).toContain('Monto');
    });

    it('should return CSV for aging report', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.ADMIN,
      });

      const asOfDate = new Date('2024-02-01T00:00:00Z');

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
        {
          total: 100,
          dueDate: new Date('2024-01-25T00:00:00Z'),
        },
        {
          total: 200,
          dueDate: new Date('2023-12-15T00:00:00Z'),
        },
      ]);

      const req = new NextRequest('http://localhost/api/v1/reports/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'aging',
          filters: {
            asOfDate: asOfDate.toISOString(),
          },
        }),
      });

      const res = await EXPORT_CSV(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="aging-report-\d{4}-\d{2}-\d{2}\.csv"/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);

      const csv = Buffer.from(buffer).toString('utf8');
      expect(csv).toContain('Rango de Días');
      expect(csv).toContain('Cantidad de Facturas');
      expect(csv).toContain('Monto Total');
      expect(csv).toContain('0-30');
      expect(csv).toContain('100.00');
      expect(csv).toContain('200.00');
    });

    it('should return 403 for unauthorized role', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        role: Role.CUSTOMER,
      });

      const req = new NextRequest('http://localhost/api/v1/reports/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'revenue',
          filters: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
        }),
      });

      const res = await EXPORT_CSV(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });
});
