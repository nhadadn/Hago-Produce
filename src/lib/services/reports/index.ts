import prisma from '@/lib/db';
import { InvoiceStatus } from '@prisma/client';
import { getCachedReport, setCachedReport, ReportType } from '@/lib/utils/report-cache';
import { logger } from '@/lib/logger/logger.service';

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: { period: string; amount: number }[];
  previousPeriodRevenue: number;
  growthRate: number | null;
  averageInvoiceAmount: number;
  _fromCache?: boolean;
}

export type AgingBucketLabel = '0-30' | '31-60' | '61-90' | '90+';

export interface AgingBucketSummary {
  bucket: AgingBucketLabel;
  invoiceCount: number;
  totalAmount: number;
}

export interface AgingReport {
  asOfDate: string;
  buckets: AgingBucketSummary[];
  _fromCache?: boolean;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  invoiceCount: number;
  averageInvoiceAmount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface PriceTrendPoint {
  period: string;
  averagePrice: number;
}

export interface SupplierPriceHistoryPoint {
  effectiveDate: string;
  price: number;
}

export interface SupplierPriceHistory {
  supplierId: string;
  supplierName: string;
  prices: SupplierPriceHistoryPoint[];
}

export interface ProductPriceTrends {
  productId: string;
  currentPrice: number | null;
  monthlyAverage: PriceTrendPoint[];
  changeVsPreviousPeriod: number | null;
  suppliers: SupplierPriceHistory[];
  _fromCache?: boolean;
}

const REVENUE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PENDING,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
];

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

function getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart, end: prevEnd };
}

function getAgingBucketLabel(daysOverdue: number): AgingBucketLabel | null {
  if (daysOverdue < 0) return null;
  if (daysOverdue <= 30) return '0-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

export async function getRevenueMetrics(
  startDate: Date,
  endDate: Date,
  options?: { customerId?: string },
): Promise<RevenueMetrics> {
  try {
    const cacheParams = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      customerId: options?.customerId,
    };
    
    const cached = await getCachedReport<RevenueMetrics>('REVENUE', cacheParams);
    if (cached) {
      return { ...cached, _fromCache: true };
    }

    const where: any = {
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: REVENUE_STATUSES,
      },
    };

    if (options?.customerId) {
      where.customerId = options.customerId;
    }

    const [aggregate, invoices] = await Promise.all([
      prisma.invoice.aggregate({
        where,
        _sum: {
          total: true,
        },
        _avg: {
          total: true,
        },
      }),
      prisma.invoice.findMany({
        where,
        select: {
          total: true,
          issueDate: true,
        },
      }),
    ]);

    const totalRevenue = Number(aggregate._sum?.total ?? 0);
    const averageInvoiceAmount = Number(aggregate._avg?.total ?? 0);

    const periodTotals = new Map<string, number>();
    for (const invoice of invoices) {
      const key = toMonthKey(invoice.issueDate);
      const previous = periodTotals.get(key) ?? 0;
      periodTotals.set(key, previous + Number(invoice.total));
    }

    const monthlyRevenue = Array.from(periodTotals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, amount]) => ({ period, amount }));

    const { start: prevStart, end: prevEnd } = getPreviousPeriod(startDate, endDate);

    const prevWhere: any = {
      issueDate: {
        gte: prevStart,
        lte: prevEnd,
      },
      status: {
        in: REVENUE_STATUSES,
      },
    };

    if (options?.customerId) {
      prevWhere.customerId = options.customerId;
    }

    const previousAggregate = await prisma.invoice.aggregate({
      where: prevWhere,
      _sum: {
        total: true,
      },
    });

    const previousPeriodRevenue = Number(previousAggregate._sum?.total ?? 0);

    let growthRate: number | null = null;
    if (previousPeriodRevenue > 0) {
      growthRate = (totalRevenue - previousPeriodRevenue) / previousPeriodRevenue;
    }

    return {
      totalRevenue,
      monthlyRevenue,
      previousPeriodRevenue,
      growthRate,
      averageInvoiceAmount,
    };
  } catch (error) {
    logger.error('[REPORTS_REVENUE_METRICS_ERROR]', error);
    throw error;
  }
}

export async function getAgingReport(
  asOfDate: Date,
  options?: { customerId?: string },
): Promise<AgingReport> {
  try {
    const where: any = {
      dueDate: {
        lte: asOfDate,
      },
      status: {
        in: [InvoiceStatus.SENT, InvoiceStatus.PENDING, InvoiceStatus.OVERDUE],
      },
    };

    if (options?.customerId) {
      where.customerId = options.customerId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        total: true,
        dueDate: true,
      },
    });

    const buckets = new Map<AgingBucketLabel, { invoiceCount: number; totalAmount: number }>();

    for (const invoice of invoices) {
      const diffMs = asOfDate.getTime() - invoice.dueDate.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const bucketLabel = getAgingBucketLabel(daysOverdue);

      if (!bucketLabel) continue;

      const existing = buckets.get(bucketLabel) ?? { invoiceCount: 0, totalAmount: 0 };
      existing.invoiceCount += 1;
      existing.totalAmount += Number(invoice.total);
      buckets.set(bucketLabel, existing);
    }

    const orderedLabels: AgingBucketLabel[] = ['0-30', '31-60', '61-90', '90+'];

    const summaries: AgingBucketSummary[] = orderedLabels.map((label) => {
      const entry = buckets.get(label) ?? { invoiceCount: 0, totalAmount: 0 };
      return {
        bucket: label,
        invoiceCount: entry.invoiceCount,
        totalAmount: entry.totalAmount,
      };
    });

    const result = {
      asOfDate: asOfDate.toISOString(),
      buckets: summaries,
    };

    const cacheParams = {
      asOfDate: asOfDate.toISOString(),
      customerId: options?.customerId,
    };

    await setCachedReport('AGING', cacheParams, result);

    return result;
  } catch (error) {
    logger.error('[REPORTS_AGING_ERROR]', error);
    throw error;
  }
}

export async function getTopCustomers(
  limit: number,
  startDate: Date,
  endDate: Date,
): Promise<TopCustomer[]> {
  try {
    const cacheParams = {
      limit,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    const cached = await getCachedReport<TopCustomer[]>('TOP_CUSTOMERS', cacheParams);
    if (cached) {
      (cached as any)._fromCache = true;
      return cached;
    }

    const result = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: REVENUE_STATUSES,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });

    if (result.length === 0) {
      return [];
    }

    const customerIds = result.map((r) => r.customerId);

    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });

    const customerMap = new Map<string, string>();
    for (const customer of customers) {
      customerMap.set(customer.id, customer.name);
    }

    const mappedResult = result.map((row) => {
      const totalRevenue = Number(row._sum.total ?? 0);
      const invoiceCount = row._count.id;
      const averageInvoiceAmount = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

      return {
        customerId: row.customerId,
        customerName: customerMap.get(row.customerId) ?? 'Unknown',
        totalRevenue,
        invoiceCount,
        averageInvoiceAmount,
      };
    });

    await setCachedReport('TOP_CUSTOMERS', cacheParams, mappedResult);

    return mappedResult;
  } catch (error) {
    logger.error('[REPORTS_TOP_CUSTOMERS_ERROR]', error);
    throw error;
  }
}

export async function getTopProducts(
  limit: number,
  startDate: Date,
  endDate: Date,
): Promise<TopProduct[]> {
  try {
    const cacheParams = {
      limit,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    const cached = await getCachedReport<TopProduct[]>('TOP_PRODUCTS', cacheParams);
    if (cached) {
      (cached as any)._fromCache = true;
      return cached;
    }

    const result = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        invoice: {
          issueDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: REVENUE_STATUSES,
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      take: limit,
    });

    if (result.length === 0) {
      return [];
    }

    const productIds = result.map((r) => r.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map<string, string>();
    for (const product of products) {
      productMap.set(product.id, product.name);
    }

    const mappedResult = result.map((row) => {
      const totalQuantity = Number(row._sum.quantity ?? 0);
      const totalRevenue = Number(row._sum.totalPrice ?? 0);
      const averagePrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;

      return {
        productId: row.productId,
        productName: productMap.get(row.productId) ?? 'Unknown',
        totalQuantity,
        totalRevenue,
        averagePrice,
      };
    });

    await setCachedReport('TOP_PRODUCTS', cacheParams, mappedResult);

    return mappedResult;
  } catch (error) {
    logger.error('[REPORTS_TOP_PRODUCTS_ERROR]', error);
    throw error;
  }
}

export async function getProductPriceTrends(
  productId: string,
  months: number,
): Promise<ProductPriceTrends> {
  try {
    const cacheParams = {
      productId,
      months,
    };

    const cached = await getCachedReport<ProductPriceTrends>('PRICE_TRENDS', cacheParams);
    if (cached) {
      return { ...cached, _fromCache: true };
    }

    const now = new Date();
    const start = new Date(now.getTime());
    start.setUTCMonth(start.getUTCMonth() - months);

    const prices = await prisma.productPrice.findMany({
      where: {
        productId,
        effectiveDate: {
          gte: start,
        },
      },
      orderBy: {
        effectiveDate: 'asc',
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const monthlyTotals = new Map<string, { sum: number; count: number }>();
    const supplierMap = new Map<string, SupplierPriceHistory>();

    let currentPrice: number | null = null;

    for (const price of prices) {
      const value = price.sellPrice ?? price.costPrice;
      const numericValue = Number(value);
      const period = toMonthKey(price.effectiveDate);

      const monthly = monthlyTotals.get(period) ?? { sum: 0, count: 0 };
      monthly.sum += numericValue;
      monthly.count += 1;
      monthlyTotals.set(period, monthly);

      const supplierId = price.supplier.id;
      const supplierName = price.supplier.name;
      let supplierHistory = supplierMap.get(supplierId);
      if (!supplierHistory) {
        supplierHistory = {
          supplierId,
          supplierName,
          prices: [],
        };
        supplierMap.set(supplierId, supplierHistory);
      }

      supplierHistory.prices.push({
        effectiveDate: price.effectiveDate.toISOString(),
        price: numericValue,
      });

      if (price.isCurrent) {
        currentPrice = numericValue;
      }
    }

    if (currentPrice === null && prices.length > 0) {
      const last = prices[prices.length - 1];
      const value = last.sellPrice ?? last.costPrice;
      currentPrice = Number(value);
    }

    const monthlyAverage: PriceTrendPoint[] = Array.from(monthlyTotals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, { sum, count }]) => ({ period, averagePrice: count > 0 ? sum / count : 0 }));

    let changeVsPreviousPeriod: number | null = null;
    if (monthlyAverage.length >= 2) {
      const last = monthlyAverage[monthlyAverage.length - 1];
      const prev = monthlyAverage[monthlyAverage.length - 2];
      if (prev.averagePrice > 0) {
        changeVsPreviousPeriod = (last.averagePrice - prev.averagePrice) / prev.averagePrice;
      }
    }

    const result = {
      productId,
      currentPrice,
      monthlyAverage,
      changeVsPreviousPeriod,
      suppliers: Array.from(supplierMap.values()),
    };

    await setCachedReport('PRICE_TRENDS', cacheParams, result);

    return result;
  } catch (error) {
    logger.error('[REPORTS_PRICE_TRENDS_ERROR]', error);
    throw error;
  }
}

