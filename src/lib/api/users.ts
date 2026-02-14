import { Role } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: Role;
  search?: string;
  isActive?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchUsers(filters: UserFilters): Promise<UsersResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.role) params.append('role', filters.role);
  if (filters.search) params.append('search', filters.search);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/users?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener usuarios');
  }

  return res.json();
}

export async function createUser(data: any): Promise<User> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/v1/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al crear usuario');
  }

  const result = await res.json();
  return result.data;
}

export async function updateUser(id: string, data: any): Promise<User> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al actualizar usuario');
  }

  const result = await res.json();
  return result.data;
}

export async function deleteUser(id: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al eliminar usuario');
  }
}
