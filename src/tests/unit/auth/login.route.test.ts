import { POST } from '@/app/api/v1/auth/login/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { comparePassword } from '@/lib/auth/password';

// Mock dependencies not globally mocked or specific to this test
jest.mock('@/lib/auth/password', () => ({
  comparePassword: jest.fn(),
}));

jest.mock('@/lib/auth/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
}));

describe('POST /api/v1/auth/login', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@hagoproduce.com',
    password: 'hashed-password',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    customerId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and tokens for valid credentials', async () => {
    // Mock request body
    const body = {
      email: 'admin@hagoproduce.com',
      password: 'password123',
    };
    const req = new NextRequest('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Mock Prisma response
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    // Mock password comparison
    (comparePassword as jest.Mock).mockResolvedValue(true);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tokens.accessToken).toBe('mock-access-token');
    expect(data.data.user.email).toBe(mockUser.email);
  });

  it('should return 401 for invalid password', async () => {
    const body = {
      email: 'admin@hagoproduce.com',
      password: 'wrongpassword',
    };
    const req = new NextRequest('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (comparePassword as jest.Mock).mockResolvedValue(false);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should log error and return 500 when an exception occurs', async () => {
    const body = {
      email: 'admin@hagoproduce.com',
      password: 'password123',
    };
    const req = new NextRequest('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Simulate DB error
    const dbError = new Error('Database connection failed');
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(dbError);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
    
    // Verify logger was called
    expect(logger.error).toHaveBeenCalledWith('Login error:', dbError);
  });
});
