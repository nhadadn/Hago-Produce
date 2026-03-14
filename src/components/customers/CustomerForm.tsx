'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CustomerInput } from '@/lib/validation/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/lib/i18n';
import { useState } from 'react';
import { Customer } from '@prisma/client';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function CustomerForm({ initialData, onSubmit, onCancel, isEditing = false }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || '',
      taxId: initialData?.taxId || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: CustomerInput) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t.customers.nameLabel}</Label>
          <Input id="name" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">{t.customers.taxIdLabel}</Label>
          <Input id="taxId" {...form.register('taxId')} />
          {form.formState.errors.taxId && (
            <p className="text-red-500 text-xs">{form.formState.errors.taxId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t.customers.emailLabel}</Label>
        <Input id="email" type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>
        )}
        <p className="text-muted-foreground text-xs">{t.customers.emailHint}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t.customers.phoneLabel}</Label>
          <Input id="phone" {...form.register('phone')} />
          {form.formState.errors.phone && (
            <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">{t.customers.addressLabel}</Label>
          <Input id="address" {...form.register('address')} />
          {form.formState.errors.address && (
            <p className="text-red-500 text-xs">{form.formState.errors.address.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={form.watch('isActive')}
          onCheckedChange={(checked) => form.setValue('isActive', checked as boolean)}
        />
        <Label htmlFor="isActive">{t.customers.isActiveLabel}</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t.common.saving : isEditing ? t.common.update : t.common.create}
        </Button>
      </div>
    </form>
  );
}
