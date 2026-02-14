'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { SupplierModal } from '@/components/suppliers/SupplierModal';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, Supplier, SupplierFilters } from '@/lib/api/suppliers';
import { Plus, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SuppliersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SupplierFilters>({ page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);

  // Search debounce
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
      loadSuppliers();
    }
  }, [filters, user]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetchSuppliers(filters);
      setSuppliers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSupplier(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, data);
      } else {
        await createSupplier(data);
      }
      setIsFormOpen(false);
      loadSuppliers();
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    try {
      await deleteSupplier(selectedSupplier.id);
      setIsDeleteOpen(false);
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  if (authLoading || !user) return <div className="p-8">Cargando...</div>;
  if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) return null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestión de proveedores y contactos.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, email..." 
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

      <SuppliersTable 
        suppliers={suppliers} 
        onEdit={handleEdit} 
        onDelete={handleDeleteClick}
        isLoading={loading}
      />

      {/* Pagination */}
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

      {/* Form Modal */}
      <SupplierModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
      >
        <SupplierForm
          initialData={selectedSupplier}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isEditing={!!selectedSupplier}
        />
      </SupplierModal>

      {/* Delete Confirmation Modal */}
      <SupplierModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmar Eliminación"
        description={`¿Estás seguro que deseas eliminar al proveedor ${selectedSupplier?.name}? Esta acción no se puede deshacer.`}
        footer={
          <div className="flex justify-end space-x-2 w-full">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
          </div>
        }
      />
    </div>
  );
}
