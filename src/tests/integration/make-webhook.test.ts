import { POST } from '@/app/api/v1/webhooks/make/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { InvoicesService } from '@/lib/services/invoices.service';

// Mock DB
jest.mock('@/lib/db', () => ({
  webhookLog: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  supplier: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  productPrice: {
    updateMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

// Mock InvoicesService
jest.mock('@/lib/services/invoices.service');

describe('POST /api/v1/webhooks/make', () => {
  const originalEnv = process.env;
  
  // Mocks for InvoicesService methods
  const mockCreateInvoice = jest.fn();
  const mockUpdateInvoice = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, MAKE_WEBHOOK_API_KEY: 'test-secret' };
    
    // Default mocks
    (prisma.webhookLog.create as jest.Mock).mockResolvedValue({});
    
    // Setup InvoicesService mock implementation
    (InvoicesService as unknown as jest.Mock).mockImplementation(() => ({
      create: mockCreateInvoice,
      update: mockUpdateInvoice,
    }));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 401 for missing API key', async () => {
    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid API key', async () => {
    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'wrong-key' },
      body: JSON.stringify({})
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload schema', async () => {
    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify({ invalid: 'data' })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('processes product.created event correctly', async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.product.create as jest.Mock).mockResolvedValue({ id: 'prod-1' });

    const payload = {
      eventType: 'product.created',
      timestamp: new Date().toISOString(),
      data: {
        name: 'New Product',
        sku: 'SKU-123',
        unit: 'kg',
        isActive: true
      }
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.product.create).toHaveBeenCalled();
  });

  it('processes product.updated event correctly', async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'prod-1' });
    (prisma.product.update as jest.Mock).mockResolvedValue({ id: 'prod-1' });

    const payload = {
      eventType: 'product.updated',
      timestamp: new Date().toISOString(),
      data: {
        sku: 'SKU-123',
        name: 'Updated Product',
        unit: 'kg',
        isActive: true
      }
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.result.action).toBe('updated');
    expect(prisma.product.update).toHaveBeenCalled();
  });

  it('processes supplier.created event correctly', async () => {
    (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.supplier.create as jest.Mock).mockResolvedValue({ id: 'supp-1' });

    const payload = {
      eventType: 'supplier.created',
      timestamp: new Date().toISOString(),
      data: {
        name: 'New Supplier',
        contactName: 'John Doe',
        email: 'supplier@test.com',
        phone: '1234567890',
        address: '123 St',
        isActive: true
      }
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.supplier.create).toHaveBeenCalled();
  });

  it('processes customer.created event correctly', async () => {
    (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.customer.create as jest.Mock).mockResolvedValue({ id: 'cust-1' });

    const payload = {
      eventType: 'customer.created',
      timestamp: new Date().toISOString(),
      data: {
        name: 'New Customer',
        taxId: 'TAX-123',
        email: 'customer@test.com',
        phone: '0987654321',
        address: '456 Ave',
        isActive: true
      }
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.customer.create).toHaveBeenCalled();
  });

  it('processes price.created event correctly', async () => {
    const payload = {
      eventType: 'price.created',
      timestamp: new Date().toISOString(),
      data: {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        supplierId: '123e4567-e89b-12d3-a456-426614174001',
        costPrice: 10.5,
        sellPrice: 15.0,
        currency: 'CAD',
        isCurrent: true,
        effectiveDate: new Date().toISOString()
      }
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.productPrice.updateMany).toHaveBeenCalled();
    expect(prisma.productPrice.create).toHaveBeenCalled();
  });

  it('processes invoice.created event correctly', async () => {
    mockCreateInvoice.mockResolvedValue({ id: 'inv-1', number: 'INV-2024-0001' });

    const payload = {
      eventType: 'invoice.created',
      timestamp: new Date().toISOString(),
      data: {
        customerId: 'cust-1',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        items: [
           { productId: 'prod-1', quantity: 10, unitPrice: 5 }
        ]
      }
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockCreateInvoice).toHaveBeenCalled();
  });

  it('handles idempotency key to prevent duplicates', async () => {
    const cachedResponse = {
      httpStatus: 200,
      body: { success: true, cached: true }
    };
    (prisma.webhookLog.findFirst as jest.Mock).mockResolvedValue({
      httpStatus: 200,
      responseBody: cachedResponse.body
    });

    const payload = {
      eventType: 'product.created',
      timestamp: new Date().toISOString(),
      idempotencyKey: 'unique-key-123',
      data: { name: 'Test', sku: 'T1', unit: 'u', isActive: true }
    };

    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'test-secret' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cached).toBe(true);
    expect(prisma.webhookLog.findFirst).toHaveBeenCalledWith({
      where: {
        source: 'make',
        idempotencyKey: 'unique-key-123'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });
});
