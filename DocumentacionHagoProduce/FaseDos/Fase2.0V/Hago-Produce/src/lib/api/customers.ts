import { CustomerInput, CustomerUpdateInput } from '@/lib/validation/customers';
import { Customer } from '@prisma/client';

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CustomersResponse {
  success: boolean;
  data: {
    data: Customer[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export async function fetchCustomers(filters: CustomerFilters): Promise<CustomersResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const res = await fetch(`/api/v1/customers?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener clientes');
  }

  return res.json();
}

export async function createCustomer(data: CustomerInput): Promise<Customer> {
  const res = await fetch('/api/v1/customers', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al crear cliente');
  }

  const result = await res.json();
  return result.data;
}

export async function updateCustomer(id: string, data: CustomerUpdateInput): Promise<Customer> {
  const res = await fetch(`/api/v1/customers/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al actualizar cliente');
  }

  const result = await res.json();
  return result.data;
}
