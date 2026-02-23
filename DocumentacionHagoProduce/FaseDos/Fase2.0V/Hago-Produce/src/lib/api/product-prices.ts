import { ProductPriceInput, ProductPriceUpdateInput, ProductPriceFilters } from '@/lib/validation/product-price';

export interface ProductPrice {
  id: string;
  productId: string;
  supplierId: string;
  costPrice: number;
  sellPrice?: number | null;
  currency: string;
  effectiveDate: string;
  isCurrent: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    unit: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
}

export interface ProductPricesResponse {
  success: boolean;
  data: ProductPrice[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export async function fetchProductPrices(filters: ProductPriceFilters): Promise<ProductPricesResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.productId) params.append('product_id', filters.productId);
  if (filters.supplierId) params.append('supplier_id', filters.supplierId);
  if (filters.isCurrent !== undefined) params.append('is_current', filters.isCurrent.toString());

  const res = await fetch(`/api/v1/product-prices?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener precios');
  }

  return res.json();
}

export async function createProductPrice(data: ProductPriceInput): Promise<ProductPrice> {
  const res = await fetch('/api/v1/product-prices', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al crear precio');
  }

  const result = await res.json();
  return result.data;
}

export async function updateProductPrice(id: string, data: ProductPriceUpdateInput): Promise<ProductPrice> {
  const res = await fetch(`/api/v1/product-prices/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al actualizar precio');
  }

  const result = await res.json();
  return result.data;
}

export async function deleteProductPrice(id: string): Promise<void> {
  const res = await fetch(`/api/v1/product-prices/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al eliminar precio');
  }
}

export async function bulkUpdateProductPrices(payload: { source: string, prices: any[] }): Promise<any> {
  const res = await fetch('/api/v1/product-prices/bulk-update', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error en actualización masiva');
  }

  const result = await res.json();
  return result.data;
}
