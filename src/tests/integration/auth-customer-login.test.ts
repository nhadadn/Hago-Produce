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

const mockUser = {
  id: 'user-1',
  email: 'customer@example.com',
  username: 'customerone',
  role: Role.CUSTOMER,
  isActive: true,
  customerId: 'cust-1',
  password: '', // set per-test after hashing
};

const mockCustomer = {
  id: 'cust-1',
  name: 'Customer One',
  taxId: 'TAX123',
  isActive: true,
};

describe('POST /auth/customer-login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login customer with valid email and password', async () => {
    const hashed = await hashPassword('secret123');
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, password: hashed });
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername: 'customer@example.com', password: 'secret123' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.access_token).toBeDefined();
    expect(body.data.customer.tax_id).toBe('TAX123');
  });

  it('should login customer with valid username and password', async () => {
    const hashed = await hashPassword('secret123');
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, password: hashed });
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername: 'customerone', password: 'secret123' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.access_token).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const hashed = await hashPassword('secret123');
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, password: hashed });
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername: 'customer@example.com', password: 'wrongpw' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 when user not found', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername: 'noexiste', password: 'secret123' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 400 for empty credentials', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/customer-login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername: '', password: 'short' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
