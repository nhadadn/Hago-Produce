import { CreateInvoiceInput, InvoiceFilters, UpdateInvoiceInput } from '@/lib/validation/invoices';
import { Invoice, InvoiceItem, Customer, InvoiceStatus } from '@prisma/client';

export interface InvoiceWithDetails extends Invoice {
  customer: Customer;
  items: (InvoiceItem & {
    product?: {
      name: string;
      sku: string;
    };
  })[];
}

export interface InvoicesResponse {
  success: boolean;
  data: {
    data: InvoiceWithDetails[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ChangeInvoiceStatusInput {
  status: InvoiceStatus;
  reason?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export async function fetchInvoices(filters: InvoiceFilters): Promise<InvoicesResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const res = await fetch(`/api/v1/invoices?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener facturas');
  }

  return res.json();
}

export async function fetchInvoice(id: string): Promise<InvoiceWithDetails> {
  const res = await fetch(`/api/v1/invoices/${id}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener factura');
  }

  const result = await res.json();
  return result.data;
}

export async function createInvoice(data: CreateInvoiceInput): Promise<InvoiceWithDetails> {
  const res = await fetch('/api/v1/invoices', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al crear factura');
  }

  const result = await res.json();
  return result.data;
}

export async function updateInvoice(id: string, data: UpdateInvoiceInput): Promise<InvoiceWithDetails> {
  const res = await fetch(`/api/v1/invoices/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al actualizar factura');
  }

  const result = await res.json();
  return result.data;
}

export async function changeInvoiceStatus(
  id: string,
  data: ChangeInvoiceStatusInput,
): Promise<InvoiceWithDetails> {
  const res = await fetch(`/api/v1/invoices/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al cambiar estado de factura');
  }

  const result = await res.json();
  return result.data;
}
