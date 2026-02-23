import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  taxId: z.string().min(1, 'El RFC es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true).optional(),
});

export const createCustomerSchema = customerSchema;

export const updateCustomerSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof createCustomerSchema>;
export type CustomerUpdateInput = z.infer<typeof updateCustomerSchema>;

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
}
