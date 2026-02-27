
import { POST } from '@/app/api/v1/webhooks/make/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { InvoicesService } from '@/lib/services/invoices.service';
import { ProductPriceService } from '@/lib/services/product-prices/product-prices.service';

// Mock Prisma
jest.mock('@/lib/db', () => {
  const mockPrisma = {
    webhookLog: { create: jest.fn(), findFirst: jest.fn() },
    product: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    supplier: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    customer: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    productPrice: { updateMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

// Mock InvoicesService
const mockCreateInvoice = jest.fn();
const mockUpdateInvoice = jest.fn();
jest.mock('@/lib/services/invoices.service', () => {
  return {
    InvoicesService: jest.fn().mockImplementation(() => ({
      create: mockCreateInvoice,
      update: mockUpdateInvoice,
    })),
  };
});

// Mock ProductPriceService
jest.mock('@/lib/services/product-prices/product-prices.service', () => ({
  ProductPriceService: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe('POST /api/v1/webhooks/make', () => {
  const API_KEY = 'test-api-key';
  
  beforeEach(() => {
    process.env.MAKE_WEBHOOK_API_KEY = API_KEY;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.MAKE_WEBHOOK_API_KEY;
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: {
        'x-make-api-key': API_KEY,
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  it('should return 401 if api key is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 401 if api key is invalid', async () => {
    const req = new NextRequest('http://localhost/api/v1/webhooks/make', {
      method: 'POST',
      headers: { 'x-make-api-key': 'invalid' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if payload is invalid', async () => {
    const req = createRequest({ invalid: 'data' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('should process product.created event', async () => {
    const payload = {
      eventType: 'product.created',
      timestamp: new Date().toISOString(),
      data: {
        name: 'Test Product',
        sku: 'TEST-SKU',
        unit: 'kg',
        isActive: true,
      },
    };

    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.product.create as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.result.action).toBe('created');
    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Test Product',
      })
    }));
  });

  it('should process product.updated event', async () => {
    const payload = {
      eventType: 'product.updated',
      timestamp: new Date().toISOString(),
      data: {
        id: validUuid,
        name: 'Updated Product',
        sku: 'TEST-SKU',
        unit: 'kg',
        isActive: true,
      },
    };

    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: validUuid });
    (prisma.product.update as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('updated');
    expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: validUuid },
      data: expect.objectContaining({
        name: 'Updated Product',
      })
    }));
  });

  it('should process supplier.created event', async () => {
    const payload = {
      eventType: 'supplier.created',
      timestamp: new Date().toISOString(),
      data: {
        name: 'Test Supplier',
        email: 'test@supplier.com',
      },
    };

    (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.supplier.create as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('created');
    expect(prisma.supplier.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Test Supplier',
      })
    }));
  });

  it('should process price.created event (standard)', async () => {
    const payload = {
      eventType: 'price.created',
      timestamp: new Date().toISOString(),
      data: {
        productId: validUuid,
        supplierId: validUuid,
        costPrice: 10,
        sellPrice: 15,
        currency: 'USD',
        isCurrent: true,
        effectiveDate: new Date().toISOString(),
      },
    };

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('created');
    expect(ProductPriceService.create).toHaveBeenCalledWith(expect.objectContaining({
      costPrice: 10,
    }));
  });

  it('should process price.created event (make format)', async () => {
    const payload = {
      eventType: 'price.created',
      timestamp: new Date().toISOString(),
      data: {
        product_name: 'Apple',
        supplier_name: 'Farm',
        cost_price: 5,
      },
    };

    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: validUuid });
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('created');
    expect(ProductPriceService.create).toHaveBeenCalledWith(expect.objectContaining({
      costPrice: 5,
      productId: validUuid,
      supplierId: validUuid,
    }));
  });

  it('should process price.created event (make format) creating new supplier', async () => {
    const payload = {
      eventType: 'price.created',
      timestamp: new Date().toISOString(),
      data: {
        product_name: 'Apple',
        supplier_name: 'New Farm',
        cost_price: 5,
      },
    };

    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: validUuid });
    (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.supplier.create as jest.Mock).mockResolvedValue({ id: 'new-supplier-id' });
    (ProductPriceService.create as jest.Mock).mockResolvedValue({ id: 'new-price-id' });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('created');
    expect(prisma.supplier.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'New Farm' })
    }));
    expect(ProductPriceService.create).toHaveBeenCalledWith(expect.objectContaining({
      supplierId: 'new-supplier-id',
    }));
  });

  it('should fail price.created event (make format) if product not found', async () => {
    const payload = {
      eventType: 'price.created',
      timestamp: new Date().toISOString(),
      data: {
        product_name: 'Unknown',
        supplier_name: 'Farm',
        cost_price: 5,
      },
    };

    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('should process price.updated event', async () => {
    const payload = {
      eventType: 'price.updated',
      timestamp: new Date().toISOString(),
      data: {
        id: validUuid,
        productId: validUuid,
        supplierId: validUuid,
        costPrice: 20,
        sellPrice: 25,
        currency: 'USD',
        isCurrent: true,
      },
    };

    (ProductPriceService.update as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('updated');
    expect(ProductPriceService.update).toHaveBeenCalledWith(validUuid, expect.objectContaining({
      costPrice: 20
    }));
  });

  it('should process supplier.updated event', async () => {
    const payload = {
      eventType: 'supplier.updated',
      timestamp: new Date().toISOString(),
      data: {
        id: validUuid,
        name: 'Updated Supplier',
        email: 'updated@supplier.com',
      },
    };

    (prisma.supplier.findFirst as jest.Mock).mockResolvedValue({ id: validUuid });
    (prisma.supplier.update as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('updated');
    expect(prisma.supplier.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: validUuid },
      data: expect.objectContaining({ name: 'Updated Supplier' })
    }));
  });

  it('should process customer.created event', async () => {
    const payload = {
      eventType: 'customer.created',
      timestamp: new Date().toISOString(),
      data: {
        name: 'Test Customer',
        taxId: 'TAX-123',
        email: 'customer@test.com',
      },
    };

    (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.customer.create as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('created');
    expect(prisma.customer.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'Test Customer' })
    }));
  });

  it('should process customer.updated event', async () => {
    const payload = {
      eventType: 'customer.updated',
      timestamp: new Date().toISOString(),
      data: {
        id: validUuid,
        name: 'Updated Customer',
        taxId: 'TAX-123',
      },
    };

    (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: validUuid });
    (prisma.customer.update as jest.Mock).mockResolvedValue({ id: validUuid });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('updated');
    expect(prisma.customer.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: validUuid },
      data: expect.objectContaining({ name: 'Updated Customer' })
    }));
  });

  it('should process invoice.updated event', async () => {
    const payload = {
      eventType: 'invoice.updated',
      timestamp: new Date().toISOString(),
      data: {
        id: validUuid,
        status: 'PAID',
      },
    };

    mockUpdateInvoice.mockResolvedValue({ id: validUuid, status: 'PAID' });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('updated');
    expect(mockUpdateInvoice).toHaveBeenCalledWith(validUuid, expect.objectContaining({
      status: 'PAID',
    }), undefined);
  });

  it('should process invoice.created event', async () => {
    const payload = {
      eventType: 'invoice.created',
      timestamp: new Date().toISOString(),
      data: {
        customerId: validUuid,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        items: [
          {
            productId: validUuid,
            quantity: 1,
            unitPrice: 100,
          }
        ],
      },
    };

    mockCreateInvoice.mockResolvedValue({ id: validUuid, number: 'INV-001' });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.result.action).toBe('created');
    expect(mockCreateInvoice).toHaveBeenCalled();
  });

  it('should return cached response if idempotency key exists', async () => {
    const payload = {
      eventType: 'product.created',
      timestamp: new Date().toISOString(),
      data: { name: 'Test', sku: 'SKU', unit: 'kg', isActive: true },
      idempotencyKey: 'key-123',
    };

    (prisma.webhookLog.findFirst as jest.Mock).mockResolvedValue({
      httpStatus: 200,
      responseBody: { cached: true },
    });

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cached).toBe(true);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('should return 500 on internal error', async () => {
    const payload = {
      eventType: 'product.created',
      timestamp: new Date().toISOString(),
      data: { name: 'Test', sku: 'SKU', unit: 'kg', isActive: true },
    };

    (prisma.product.findFirst as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const req = createRequest(payload);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(prisma.webhookLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'error',
        httpStatus: 500,
      })
    }));
  });
});
