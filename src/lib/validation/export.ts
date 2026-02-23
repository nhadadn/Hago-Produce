import { z } from 'zod';

export const exportPDFSchema = z.object({
  reportType: z.enum(['revenue', 'aging', 'top-customers', 'top-products', 'price-trends']),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    customerId: z.string().optional(),
    asOfDate: z.string().optional(),
    productId: z.string().optional(),
    months: z.number().int().min(1).max(24).optional(),
  }),
});

export const exportCSVSchema = exportPDFSchema;
