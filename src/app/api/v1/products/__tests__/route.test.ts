
/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
  unauthorizedResponse: jest.fn(() => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })),
}));

jest.mock('@/lib/services/productService', () => ({
  ProductService: {
    getAll: jest.fn(),
  },
}));

jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { ProductService } from '@/lib/services/productService';

describe('GET /api/v1/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with default pagination when no params provided', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
    (ProductService.getAll as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/products');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(ProductService.getAll).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      limit: 20,
    }));
  });

  it('returns 200 with provided pagination params', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
    (ProductService.getAll as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/products?page=2&limit=10');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(ProductService.getAll).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      limit: 10,
    }));
  });

  it('returns 200 when isActive is not provided (undefined)', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
    (ProductService.getAll as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    // This reproduces the bug: ?page=1&limit=20 but no isActive
    const req = new NextRequest('http://localhost:3000/api/v1/products?page=1&limit=20');
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    expect(ProductService.getAll).toHaveBeenCalledWith(expect.objectContaining({
      isActive: undefined,
    }));
  });

  it('returns 200 when isActive is provided as true', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
    (ProductService.getAll as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/products?isActive=true');
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    expect(ProductService.getAll).toHaveBeenCalledWith(expect.objectContaining({
      isActive: 'true',
    }));
  });
});
