'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomersTable } from '@/components/customers/CustomersTable';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { fetchCustomers, createCustomer, CustomerFilters } from '@/lib/api/customers';
import { CustomerInput } from '@/lib/validation/customers';
import { Customer } from '@prisma/client';
import { Plus, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CustomersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({ page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (user && (user.role === Role.ADMIN || user.role === Role.ACCOUNTING)) {
      loadCustomers();
    }
  }, [filters, user]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetchCustomers(filters);
      setCustomers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCustomer(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: CustomerInput) => {
    if (selectedCustomer) {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/customers/${selectedCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Error al actualizar cliente');
      }
    } else {
      await createCustomer(data);
    }
    setIsFormOpen(false);
    loadCustomers();
  };

  if (authLoading || !user) return <div className="p-8">Cargando...</div>;
  if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) return null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes y contactos.</p>
        </div>
        {user.role === Role.ADMIN && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, RFC..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, isActive: val === 'ALL' ? undefined : val === 'ACTIVE', page: 1 }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="INACTIVE">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CustomersTable
        customers={customers}
        onEdit={handleEdit}
        isLoading={loading}
      />

      {/* Paginación */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          disabled={filters.page === 1}
          onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
        >
          Anterior
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          Página {filters.page} de {totalPages}
        </div>
        <Button
          variant="outline"
          disabled={filters.page === totalPages}
          onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
        >
          Siguiente
        </Button>
      </div>

      <CustomerModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <CustomerForm
          initialData={selectedCustomer}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isEditing={!!selectedCustomer}
        />
      </CustomerModal>
    </div>
  );
}
