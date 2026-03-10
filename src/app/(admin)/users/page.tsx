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
import { UserPhoneEditDialog } from '@/components/users/UserPhoneEditDialog';
import { fetchUsers, createUser, updateUser, deleteUser, User, UserFilters } from '@/lib/api/users';
import { Plus, Search } from 'lucide-react';
import { clientLogger as logger } from '@/lib/logger/client-logger';
import { useLanguage } from '@/lib/i18n';

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
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
      logger.error('Error loading users:', error);
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

  const handleEditPhone = (user: User) => {
    setSelectedUser(user);
    setIsPhoneOpen(true);
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
      logger.error('Error deleting user:', error);
    }
  };

  if (authLoading || !user) return <div className="p-8">{t.common.loading}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.users.title}</h1>
          <p className="text-muted-foreground">{t.users.subtitle}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t.users.newUser}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.users.searchPlaceholder}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, role: val === 'ALL' ? undefined : val as Role, page: 1 }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.users.filterByRole} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.users.allRoles}</SelectItem>
            {Object.values(Role).map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, isActive: val === 'ALL' ? undefined : val === 'true', page: 1 }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.users.allStatuses} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.common.all}</SelectItem>
            <SelectItem value="true">{t.users.activeOnly}</SelectItem>
            <SelectItem value="false">{t.users.inactiveOnly}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <UsersTable
        users={users}
        onEdit={handleEdit}
        onEditPhone={handleEditPhone}
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
          {t.common.previous}
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          {t.common.page} {filters.page} {t.common.of} {totalPages}
        </div>
        <Button
          variant="outline"
          disabled={filters.page === totalPages}
          onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
        >
          {t.common.next}
        </Button>
      </div>

      {/* Create/Edit Modal */}
      <UserModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedUser ? t.users.editUserTitle : t.users.createUser}
        description={selectedUser ? t.users.modifyUserDesc : t.users.addUserDesc}
      >
        <UserForm
          initialData={selectedUser}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isEditing={!!selectedUser}
        />
      </UserModal>

      <UserPhoneEditDialog
        user={selectedUser || null}
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        onSuccess={loadUsers}
      />

      {/* Delete Confirmation Modal */}
      <UserModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={t.users.deactivateUser}
        description={t.users.deactivateConfirmDesc.replace('{name}', `${selectedUser?.firstName || ''} ${selectedUser?.lastName || ''}`)}
        footer={
          <div className="flex justify-end space-x-2 w-full">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>{t.users.deactivate}</Button>
          </div>
        }
      />
    </div>
  );
}
