import { z } from 'zod';

export const productPriceSchema = z.object({
  productId: z.string().uuid({ message: "Product ID must be a valid UUID" }),
  supplierId: z.string().uuid({ message: "Supplier ID must be a valid UUID" }),
  costPrice: z.number().min(0, { message: "Cost price must be non-negative" }),
  sellPrice: z.number().min(0, { message: "Sell price must be non-negative" }).optional(),
  currency: z.string().default('USD'),
  effectiveDate: z.coerce.date().default(() => new Date()),
  isCurrent: z.boolean().default(true),
  source: z.string().optional().default('manual'),
});

export const productPriceUpdateSchema = productPriceSchema.partial();

export const productPriceFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  isCurrent: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1)).optional(),
  limit: z.preprocess((val) => Number(val) || 50, z.number().min(1).max(100)).optional(),
});

export type ProductPriceInput = z.infer<typeof productPriceSchema>;
export type ProductPriceUpdateInput = z.infer<typeof productPriceUpdateSchema>;
export type ProductPriceFilters = z.infer<typeof productPriceFilterSchema>;
