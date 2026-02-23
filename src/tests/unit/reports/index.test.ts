import prisma from '@/lib/db';
import {
  getRevenueMetrics,
  getAgingReport,
  getTopCustomers,
  getTopProducts,
  getProductPriceTrends,
} from '@/lib/services/reports';

jest.mock('@/lib/db', () => ({
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
}));

describe('Reports service', () => {
  const mockPrisma = prisma as unknown as {
    invoice: {
      aggregate: jest.Mock;
      findMany: jest.Mock;
      groupBy: jest.Mock;
    };
    customer: {
      findMany: jest.Mock;
    };
    invoiceItem: {
      groupBy: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
    };
    productPrice: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes revenue metrics with aggregates and previous period', async () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    mockPrisma.invoice.aggregate
      .mockResolvedValueOnce({
        _sum: { total: 300 },
        _avg: { total: 100 },
      })
      .mockResolvedValueOnce({
        _sum: { total: 150 },
      });

    mockPrisma.invoice.findMany.mockResolvedValue([
      { total: 100, issueDate: new Date('2024-01-05') },
      { total: 200, issueDate: new Date('2024-01-15') },
    ]);

    const result = await getRevenueMetrics(start, end);

    expect(mockPrisma.invoice.aggregate).toHaveBeenCalledTimes(2);
    expect(result.totalRevenue).toBe(300);
    expect(result.averageInvoiceAmount).toBe(100);
    expect(result.previousPeriodRevenue).toBe(150);
    expect(result.monthlyRevenue).toEqual([
      { period: '2024-01', amount: 300 },
    ]);
    expect(result.growthRate).toBeCloseTo((300 - 150) / 150);
  });

  it('builds aging report buckets correctly', async () => {
    const asOfDate = new Date('2024-02-01T00:00:00Z');

    mockPrisma.invoice.findMany.mockResolvedValue([
      {
        total: 100,
        dueDate: new Date('2024-01-25T00:00:00Z'),
      },
      {
        total: 200,
        dueDate: new Date('2023-12-15T00:00:00Z'),
      },
    ]);

    const report = await getAgingReport(asOfDate);

    expect(mockPrisma.invoice.findMany).toHaveBeenCalled();
    const bucket0to30 = report.buckets.find((b) => b.bucket === '0-30');
    const bucket31to60 = report.buckets.find((b) => b.bucket === '31-60');

    expect(bucket0to30?.invoiceCount).toBeGreaterThanOrEqual(1);
    expect(bucket31to60?.invoiceCount).toBeGreaterThanOrEqual(1);
  });

  it('returns top customers sorted by revenue with averages', async () => {
    mockPrisma.invoice.groupBy.mockResolvedValue([
      {
        customerId: 'cust-1',
        _sum: { total: 300 },
        _count: { id: 3 },
      },
    ]);

    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 'cust-1', name: 'Customer 1' },
    ]);

    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    const top = await getTopCustomers(5, start, end);

    expect(mockPrisma.invoice.groupBy).toHaveBeenCalled();
    expect(top).toEqual([
      {
        customerId: 'cust-1',
        customerName: 'Customer 1',
        totalRevenue: 300,
        invoiceCount: 3,
        averageInvoiceAmount: 100,
      },
    ]);
  });

  it('returns top products with quantities and revenue', async () => {
    mockPrisma.invoiceItem.groupBy.mockResolvedValue([
      {
        productId: 'prod-1',
        _sum: { quantity: 10, totalPrice: 500 },
      },
    ]);

    mockPrisma.product.findMany.mockResolvedValue([
      { id: 'prod-1', name: 'Product 1' },
    ]);

    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    const top = await getTopProducts(5, start, end);

    expect(mockPrisma.invoiceItem.groupBy).toHaveBeenCalled();
    expect(top).toEqual([
      {
        productId: 'prod-1',
        productName: 'Product 1',
        totalQuantity: 10,
        totalRevenue: 500,
        averagePrice: 50,
      },
    ]);
  });

  it('builds price trends with monthly averages and supplier history', async () => {
    mockPrisma.productPrice.findMany.mockResolvedValue([
      {
        productId: 'prod-1',
        supplierId: 'sup-1',
        costPrice: 10,
        sellPrice: 20,
        currency: 'USD',
        effectiveDate: new Date('2024-01-10T00:00:00Z'),
        isCurrent: false,
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 'sup-1',
          name: 'Supplier 1',
        },
      },
      {
        productId: 'prod-1',
        supplierId: 'sup-1',
        costPrice: 12,
        sellPrice: 22,
        currency: 'USD',
        effectiveDate: new Date('2024-02-10T00:00:00Z'),
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

    const trends = await getProductPriceTrends('prod-1', 3);

    expect(mockPrisma.productPrice.findMany).toHaveBeenCalled();
    expect(trends.productId).toBe('prod-1');
    expect(trends.currentPrice).toBe(22);
    expect(trends.monthlyAverage.length).toBeGreaterThanOrEqual(1);
    expect(trends.suppliers[0].supplierId).toBe('sup-1');
  });
});

