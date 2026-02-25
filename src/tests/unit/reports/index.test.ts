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
  reportCache: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
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
    reportCache: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
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

  it('classifies invoices into 61-90 and 90+ buckets correctly', async () => {
    const asOfDate = new Date('2024-04-01T00:00:00Z');

    mockPrisma.invoice.findMany.mockResolvedValue([
      {
        total: 100,
        dueDate: new Date('2024-01-20T00:00:00Z'), // ~72 days overdue -> 61-90
      },
      {
        total: 200,
        dueDate: new Date('2023-12-01T00:00:00Z'), // ~122 days overdue -> 90+
      },
    ]);

    const report = await getAgingReport(asOfDate);

    const bucket61to90 = report.buckets.find((b) => b.bucket === '61-90');
    const bucket90plus = report.buckets.find((b) => b.bucket === '90+');

    expect(bucket61to90?.invoiceCount).toBe(1);
    expect(bucket90plus?.invoiceCount).toBe(1);
  });

  it('filters revenue metrics by customerId', async () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');
    const customerId = 'cust-123';

    mockPrisma.invoice.aggregate
      .mockResolvedValueOnce({ _sum: { total: 100 }, _avg: { total: 100 } })
      .mockResolvedValueOnce({ _sum: { total: 50 } });

    mockPrisma.invoice.findMany.mockResolvedValue([]);

    await getRevenueMetrics(start, end, { customerId });

    expect(mockPrisma.invoice.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          customerId: customerId
        })
      })
    );
  });

  it('filters aging report by customerId', async () => {
    const asOfDate = new Date();
    const customerId = 'cust-123';

    mockPrisma.invoice.findMany.mockResolvedValue([]);

    await getAgingReport(asOfDate, { customerId });

    expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          customerId: customerId
        })
      })
    );
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

  describe('Caching behavior', () => {
    it('returns cached revenue metrics if available', async () => {
      const cachedData = {
        totalRevenue: 1000,
        monthlyRevenue: [],
        previousPeriodRevenue: 0,
        growthRate: 0,
        averageInvoiceAmount: 0,
      };
      
      mockPrisma.reportCache.findFirst.mockResolvedValue({
        data: JSON.stringify(cachedData),
        expiresAt: new Date(Date.now() + 10000), // Future expiration
      });

      const result = await getRevenueMetrics(new Date(), new Date());
      expect(result._fromCache).toBe(true);
      expect(result.totalRevenue).toBe(1000);
      expect(mockPrisma.invoice.aggregate).not.toHaveBeenCalled();
    });

    it('returns cached top customers if available', async () => {
      const cachedData = [{ customerId: 'c1', totalRevenue: 100 }];
      
      mockPrisma.reportCache.findFirst.mockResolvedValue({
        data: JSON.stringify(cachedData),
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await getTopCustomers(5, new Date(), new Date());
      expect((result as any)._fromCache).toBe(true);
      expect(result).toHaveLength(1);
      expect(mockPrisma.invoice.groupBy).not.toHaveBeenCalled();
    });

    it('returns cached top products if available', async () => {
      const cachedData = [{ productId: 'p1', totalRevenue: 100 }];
      
      mockPrisma.reportCache.findFirst.mockResolvedValue({
        data: JSON.stringify(cachedData),
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await getTopProducts(5, new Date(), new Date());
      expect((result as any)._fromCache).toBe(true);
      expect(result).toHaveLength(1);
      expect(mockPrisma.invoiceItem.groupBy).not.toHaveBeenCalled();
    });

    it('returns cached price trends if available', async () => {
      const cachedData = {
        productId: 'p1',
        currentPrice: 100,
        monthlyAverage: [],
        changeVsPreviousPeriod: 0,
        suppliers: [],
      };
      
      mockPrisma.reportCache.findFirst.mockResolvedValue({
        data: JSON.stringify(cachedData),
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await getProductPriceTrends('p1', 6);
      expect(result._fromCache).toBe(true);
      expect(result.currentPrice).toBe(100);
      expect(mockPrisma.productPrice.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and Error handling', () => {
    it('handles empty results for top customers', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.groupBy.mockResolvedValue([]);

      const result = await getTopCustomers(5, new Date(), new Date());
      expect(result).toEqual([]);
      expect(mockPrisma.customer.findMany).not.toHaveBeenCalled();
    });

    it('handles empty results for top products', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoiceItem.groupBy.mockResolvedValue([]);

      const result = await getTopProducts(5, new Date(), new Date());
      expect(result).toEqual([]);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('handles unknown customer names in top customers', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.groupBy.mockResolvedValue([
        { customerId: 'unknown', _sum: { total: 100 }, _count: { id: 1 } }
      ]);
      mockPrisma.customer.findMany.mockResolvedValue([]); // No matching customer

      const result = await getTopCustomers(5, new Date(), new Date());
      expect(result[0].customerName).toBe('Unknown');
    });

    it('handles unknown product names in top products', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoiceItem.groupBy.mockResolvedValue([
        { productId: 'unknown', _sum: { quantity: 1, totalPrice: 100 } }
      ]);
      mockPrisma.product.findMany.mockResolvedValue([]); // No matching product

      const result = await getTopProducts(5, new Date(), new Date());
      expect(result[0].productName).toBe('Unknown');
    });

    it('calculates current price from last entry if no current flag', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.productPrice.findMany.mockResolvedValue([
        {
          productId: 'p1',
          supplierId: 's1',
          sellPrice: 50,
          effectiveDate: new Date(),
          isCurrent: false,
          supplier: { id: 's1', name: 'S1' }
        }
      ]);

      const result = await getProductPriceTrends('p1', 6);
      expect(result.currentPrice).toBe(50);
    });

    it('handles database errors in getRevenueMetrics', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.aggregate.mockRejectedValue(new Error('DB Error'));
      
      await expect(getRevenueMetrics(new Date(), new Date()))
        .rejects.toThrow('DB Error');
    });

    it('handles database errors in getAgingReport', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.findMany.mockRejectedValue(new Error('DB Error'));
      
      await expect(getAgingReport(new Date()))
        .rejects.toThrow('DB Error');
    });

    it('handles database errors in getTopCustomers', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.groupBy.mockRejectedValue(new Error('DB Error'));
      
      await expect(getTopCustomers(5, new Date(), new Date()))
        .rejects.toThrow('DB Error');
    });

    it('handles database errors in getTopProducts', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.invoiceItem.groupBy.mockRejectedValue(new Error('DB Error'));
      
      await expect(getTopProducts(5, new Date(), new Date()))
        .rejects.toThrow('DB Error');
    });

    it('handles database errors in getProductPriceTrends', async () => {
      mockPrisma.reportCache.findFirst.mockResolvedValue(null);
      mockPrisma.productPrice.findMany.mockRejectedValue(new Error('DB Error'));
      
      await expect(getProductPriceTrends('p1', 6))
        .rejects.toThrow('DB Error');
    });
  });
});

