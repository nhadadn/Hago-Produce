import { createSupplierSchema, updateSupplierSchema } from '@/lib/validation/suppliers';
import { z } from 'zod';

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface SuppliersResponse {
  success: boolean;
  data: Supplier[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export async function fetchSuppliers(filters: SupplierFilters): Promise<SuppliersResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/suppliers?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener proveedores');
  }

  return res.json();
}

export async function createSupplier(data: CreateSupplierInput): Promise<Supplier> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/v1/suppliers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al crear proveedor');
  }

  const result = await res.json();
  return result.data;
}

export async function updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/suppliers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al actualizar proveedor');
  }

  const result = await res.json();
  return result.data;
}

export async function deleteSupplier(id: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/suppliers/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al eliminar proveedor');
  }
}
