import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  role: z.enum(['ADMIN', 'ACCOUNTING', 'MANAGEMENT', 'CUSTOMER']).optional(),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token requerido'),
});

export const customerLoginSchema = z.object({
  tax_id: z.string().min(1, 'El RFC del cliente es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
