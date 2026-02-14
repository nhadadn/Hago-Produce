import { ProductInput, ProductUpdateInput } from '@/lib/validation/product';

export interface Product {
  id: string;
  name: string;
  nameEs?: string | null;
  description?: string | null;
  category?: string | null;
  unit: string;
  sku?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export async function fetchProducts(filters: ProductFilters): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const res = await fetch(`/api/v1/products?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener productos');
  }

  return res.json();
}

export async function createProduct(data: ProductInput): Promise<Product> {
  const res = await fetch('/api/v1/products', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al crear producto');
  }

  const result = await res.json();
  return result.data;
}

export async function updateProduct(id: string, data: ProductUpdateInput): Promise<Product> {
  const res = await fetch(`/api/v1/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al actualizar producto');
  }

  const result = await res.json();
  return result.data;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/v1/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al eliminar producto');
  }
}
