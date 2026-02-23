import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/auth/customer-login/route';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';

jest.mock('@/lib/db', () => {
  const mockPrisma = {
    customer: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('POST /auth/customer-login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login customer with valid Tax ID and password', async () => {
    const hashed = await hashPassword('secret123');

    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'cust-1',
      name: 'Customer One',
      taxId: 'TAX123',
      isActive: true,
    });

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'customer@example.com',
      password: hashed,
      role: Role.CUSTOMER,
      isActive: true,
    });

    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ tax_id: 'TAX123', password: 'secret123' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.access_token).toBeDefined();
    expect(body.data.customer.tax_id).toBe('TAX123');
  });

  it('should return 401 for invalid credentials', async () => {
    const hashed = await hashPassword('secret123');

    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'cust-1',
      name: 'Customer One',
      taxId: 'TAX123',
      isActive: true,
    });

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'customer@example.com',
      password: hashed,
      role: Role.CUSTOMER,
      isActive: true,
    });

    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ tax_id: 'TAX123', password: 'wrongpw' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ tax_id: '', password: 'short' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
