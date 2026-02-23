import { z } from 'zod';

export const revenueReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  customerId: z.string().optional(),
});

export const agingReportSchema = z.object({
  asOfDate: z.string().optional(),
  customerId: z.string().optional(),
});

export const topCustomersReportSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const topProductsReportSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const priceTrendsReportSchema = z.object({
  productId: z.string(),
  months: z.number().int().min(1).max(24).optional().default(6),
});

