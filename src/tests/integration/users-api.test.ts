import { GET, POST } from '@/app/api/v1/users/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth/middleware';

// Mock auth middleware
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

// Mock DB
jest.mock('@/lib/db', () => ({
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(), // Added for completeness if needed later
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe('Users API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return 403 if not admin', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.MANAGEMENT });
      
      const req = new NextRequest('http://localhost/api/v1/users');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return users list if admin', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest('http://localhost/api/v1/users?page=1');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('POST /users', () => {
    it('should create user if admin and valid data', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new',
        email: 'new@example.com',
        role: Role.MANAGEMENT,
        isActive: true,
        createdAt: new Date(),
      });

      const req = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: 'MANAGEMENT',
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('should return 400 for invalid data', async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.ADMIN });

      const req = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email', // Invalid
          password: '123', // Too short
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
