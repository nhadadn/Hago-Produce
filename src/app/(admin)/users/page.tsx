'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UsersTable } from '@/components/users/UsersTable';
import { UserModal } from '@/components/users/UserModal';
import { UserForm } from '@/components/users/UserForm';
import { fetchUsers, createUser, updateUser, deleteUser, User, UserFilters } from '@/lib/api/users';
import { Plus, Search } from 'lucide-react';

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

  // Search debounce
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== Role.ADMIN)) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (user?.role === Role.ADMIN) {
      loadUsers();
    }
  }, [filters, user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchUsers(filters);
      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, data);
      } else {
        await createUser(data);
      }
      setIsFormOpen(false);
      loadUsers();
    } catch (error) {
      throw error; // Let form handle error display
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.id);
      setIsDeleteOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (authLoading || !user) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios internos y permisos.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o email..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, role: val === 'ALL' ? undefined : val as Role, page: 1 }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los roles</SelectItem>
            {Object.values(Role).map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, isActive: val === 'ALL' ? undefined : val === 'true', page: 1 }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <UsersTable 
        users={users} 
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

      {/* Create/Edit Modal */}
      <UserModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedUser ? "Editar Usuario" : "Crear Usuario"}
        description={selectedUser ? "Modifica los datos del usuario." : "Agrega un nuevo usuario al sistema."}
      >
        <UserForm 
          initialData={selectedUser} 
          onSubmit={handleFormSubmit} 
          onCancel={() => setIsFormOpen(false)}
          isEditing={!!selectedUser}
        />
      </UserModal>

      {/* Delete Confirmation Modal */}
      <UserModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Desactivar Usuario"
        description={`¿Estás seguro que deseas desactivar al usuario ${selectedUser?.firstName} ${selectedUser?.lastName}? Esta acción no eliminará los datos pero restringirá el acceso.`}
        footer={
          <div className="flex justify-end space-x-2 w-full">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Desactivar</Button>
          </div>
        }
      />
    </div>
  );
}
