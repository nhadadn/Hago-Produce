import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/customers/route';
import { GET as GET_ID, PATCH, DELETE } from '@/app/api/v1/customers/[id]/route';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';

jest.mock('@/lib/db', () => ({
  customer: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 }),
}));

describe('Customers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /customers', () => {
    it('should return list of customers', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([{ id: '1', name: 'Cust 1' }]);
      (prisma.customer.count as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest('http://localhost/api/v1/customers');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.customers).toHaveLength(1);
    });

    it('should filter by search term', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.customer.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest('http://localhost/api/v1/customers?search=test');
      await GET(req);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'test', mode: 'insensitive' } },
          ])
        })
      }));
    });
  });

  describe('POST /customers', () => {
    it('should create customer if ADMIN', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null); // No existing taxId
      (prisma.customer.create as jest.Mock).mockResolvedValue({ id: '1', name: 'New Cust' });

      const req = new NextRequest('http://localhost/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Cust', taxId: 'TAX123' }),
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('should fail if Tax ID exists', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: '2', taxId: 'TAX123' });

      const req = new NextRequest('http://localhost/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Cust', taxId: 'TAX123' }),
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(409); // Conflict
      expect(body.error.code).toBe('DUPLICATE_ENTRY');
    });

     it('should forbid non-ADMIN', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.MANAGEMENT });

      const req = new NextRequest('http://localhost/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Cust' }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /customers/[id]', () => {
    it('should update customer', async () => {
        (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
        (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null); // TaxId check passes
        (prisma.customer.update as jest.Mock).mockResolvedValue({ id: '1', name: 'Updated' });

        const req = new NextRequest('http://localhost/api/v1/customers/1', {
            method: 'PATCH',
            body: JSON.stringify({ name: 'Updated' }),
        });
        const res = await PATCH(req, { params: { id: '1' } });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });
  });

  describe('DELETE /customers/[id]', () => {
      it('should soft delete customer', async () => {
          (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
          (prisma.customer.update as jest.Mock).mockResolvedValue({ id: '1', isActive: false });

          const req = new NextRequest('http://localhost/api/v1/customers/1', { method: 'DELETE' });
          const res = await DELETE(req, { params: { id: '1' } });
          
          expect(res.status).toBe(200);
          expect(prisma.customer.update).toHaveBeenCalledWith({
              where: { id: '1' },
              data: { isActive: false }
          });
      });
  });
});
