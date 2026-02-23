import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  description: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  issueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  dueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  status: z.nativeEnum(InvoiceStatus).optional().default(InvoiceStatus.DRAFT),
  notes: z.string().optional(),
  taxRate: z.number().min(0).optional().default(0.13),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const invoiceFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFilterSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
