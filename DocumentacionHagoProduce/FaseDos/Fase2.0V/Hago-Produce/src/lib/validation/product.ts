import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  "Frutas",
  "Verduras",
  "Hortalizas",
  "Legumbres",
  "Tubérculos",
  "Hierbas",
  "Granos",
  "Frutos Secos",
  "Otros",
] as const;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  nameEs: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string(),
  sku: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export const productUpdateSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).optional().transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).optional().transform(Number).default('20'),
});

export type ProductFilters = z.infer<typeof productFilterSchema>;
