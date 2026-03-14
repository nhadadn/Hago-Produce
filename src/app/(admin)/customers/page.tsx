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
import { fetchCustomers, createCustomer, resetPortalPassword, CustomerFilters } from '@/lib/api/customers';
import { CustomerInput } from '@/lib/validation/customers';
import { Customer } from '@prisma/client';
import { Plus, Search, Copy, CheckCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { clientLogger as logger } from '@/lib/logger/client-logger';
import { useLanguage } from '@/lib/i18n';

export default function CustomersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({ page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; username?: string | null; password: string; isReset?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

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
      setCustomers(response.data.customers ?? []);
      setTotalPages(response.data.meta?.totalPages ?? 1);
    } catch (error) {
      logger.error('Error loading customers:', error);
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
      setIsFormOpen(false);
      loadCustomers();
    } else {
      const result = await createCustomer(data);
      setIsFormOpen(false);
      loadCustomers();
      setCreatedCredentials({ email: data.email, username: result.username, password: result.portalPassword });
    }
  };

  const handleResetPassword = async (customer: Customer) => {
    try {
      const result = await resetPortalPassword(customer.id);
      setCreatedCredentials({ email: result.email, username: result.username, password: result.portalPassword, isReset: true });
    } catch (error) {
      logger.error('Error resetting portal password:', error);
    }
  };

  const handleCopyCredentials = () => {
    const lines = [
      createdCredentials?.username ? `${t.customers.usernameLabel} ${createdCredentials.username}` : null,
      `${t.customers.emailFieldLabel} ${createdCredentials?.email}`,
      `${t.customers.passwordFieldLabel} ${createdCredentials?.password}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || !user) return <div className="p-8">{t.common.loading}</div>;
  if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) return null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.customers.title}</h1>
          <p className="text-muted-foreground">{t.customers.subtitle}</p>
        </div>
        {user.role === Role.ADMIN && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t.customers.newCustomer}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.customers.searchPlaceholder}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, isActive: val === 'ALL' ? undefined : val === 'ACTIVE', page: 1 }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.customers.allStatuses} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.common.all}</SelectItem>
            <SelectItem value="ACTIVE">{t.customers.activeOnly}</SelectItem>
            <SelectItem value="INACTIVE">{t.customers.inactiveOnly}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CustomersTable
        customers={customers}
        onEdit={handleEdit}
        onResetPassword={user.role === Role.ADMIN ? handleResetPassword : undefined}
        isLoading={loading}
      />

      {/* Paginación */}
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

      <CustomerModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCustomer ? t.customers.editCustomer : t.customers.newCustomer}
      >
        <CustomerForm
          initialData={selectedCustomer}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isEditing={!!selectedCustomer}
        />
      </CustomerModal>

      <Dialog open={!!createdCredentials} onOpenChange={() => { setCreatedCredentials(null); setCopied(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{createdCredentials?.isReset ? t.customers.credentialsResetTitle : t.customers.credentialsTitle}</DialogTitle>
            <DialogDescription>
              {t.customers.credentialsDescription}{' '}
              <strong className="text-destructive">{t.customers.credentialsWarning}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-2">
              {createdCredentials?.username && (
                <div><span className="text-muted-foreground">{t.customers.usernameLabel} </span><strong>{createdCredentials.username}</strong></div>
              )}
              <div><span className="text-muted-foreground">{t.customers.emailFieldLabel} </span><strong>{createdCredentials?.email}</strong></div>
              <div><span className="text-muted-foreground">{t.customers.passwordFieldLabel} </span><strong>{createdCredentials?.password}</strong></div>
            </div>
            <Button className="w-full" onClick={handleCopyCredentials} variant="outline">
              {copied
                ? <><CheckCheck className="w-4 h-4 mr-2" />{t.common.copied}</>
                : <><Copy className="w-4 h-4 mr-2" />{t.common.copyCredentials}</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
