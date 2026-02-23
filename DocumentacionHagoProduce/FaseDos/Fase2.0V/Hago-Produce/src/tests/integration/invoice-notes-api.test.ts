import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/invoices/[id]/notes/route';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';

jest.mock('@/lib/db', () => {
  const mockPrisma = {
    invoiceNote: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: () =>
    new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), {
      status: 401,
    }),
}));

describe('Invoice Notes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /invoices/:id/notes', () => {
    it('should return notes for allowed roles', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        role: Role.ADMIN,
      });

      (prisma.invoiceNote.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'note-1',
          content: 'Test note',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          user: {
            id: 'user-1',
            firstName: 'Test',
            lastName: 'User',
          },
        },
      ]);

      const req = new NextRequest(
        'http://localhost/api/v1/invoices/inv-1/notes',
      );

      const res = await GET(req, { params: { id: 'inv-1' } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(prisma.invoiceNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invoiceId: 'inv-1' },
        }),
      );
    });

    it('should forbid CUSTOMER role', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        role: Role.CUSTOMER,
      });

      const req = new NextRequest(
        'http://localhost/api/v1/invoices/inv-1/notes',
      );

      const res = await GET(req, { params: { id: 'inv-1' } });
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /invoices/:id/notes', () => {
    it('should create note with correct userId', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'internal-1',
        role: Role.ACCOUNTING,
      });

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-1',
      });

      (prisma.invoiceNote.create as jest.Mock).mockResolvedValue({
        id: 'note-1',
        content: 'Pago parcial recibido',
        createdAt: new Date('2025-01-02T00:00:00Z'),
        invoiceId: 'inv-1',
        userId: 'internal-1',
        user: {
          id: 'internal-1',
          firstName: 'María',
          lastName: 'López',
        },
      });

      const payload = {
        content: 'Pago parcial recibido',
      };

      const req = new NextRequest(
        'http://localhost/api/v1/invoices/inv-1/notes',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const res = await POST(req, { params: { id: 'inv-1' } });
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(prisma.invoiceNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceId: 'inv-1',
            userId: 'internal-1',
            content: payload.content,
          }),
        }),
      );
    });

    it('should forbid MANAGEMENT role for creating notes', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        role: Role.MANAGEMENT,
      });

      const payload = {
        content: 'Nota de prueba',
      };

      const req = new NextRequest(
        'http://localhost/api/v1/invoices/inv-1/notes',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const res = await POST(req, { params: { id: 'inv-1' } });
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should validate content field', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'internal-1',
        role: Role.ADMIN,
      });

      const payload = {
        content: '',
      };

      const req = new NextRequest(
        'http://localhost/api/v1/invoices/inv-1/notes',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const res = await POST(req, { params: { id: 'inv-1' } });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if invoice does not exist', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        userId: 'internal-1',
        role: Role.ADMIN,
      });

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      const payload = {
        content: 'Nota de prueba',
      };

      const req = new NextRequest(
        'http://localhost/api/v1/invoices/inv-unknown/notes',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const res = await POST(req, { params: { id: 'inv-unknown' } });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});

