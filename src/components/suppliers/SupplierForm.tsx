import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupplierSchema } from '@/lib/validation/suppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { CreateSupplierInput } from '@/lib/api/suppliers';

interface SupplierFormProps {
  initialData?: any;
  onSubmit: (data: CreateSupplierInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function SupplierForm({ initialData, onSubmit, onCancel, isEditing = false }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: initialData?.name || '',
      contactName: initialData?.contactName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: CreateSupplierInput) => {
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
      
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Empresa *</Label>
        <Input id="name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Nombre de Contacto</Label>
          <Input id="contactName" {...form.register('contactName')} />
          {form.formState.errors.contactName && (
            <p className="text-red-500 text-xs">{form.formState.errors.contactName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...form.register('phone')} />
          {form.formState.errors.phone && (
            <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
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
        <Label htmlFor="isActive">Activo</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
        </Button>
      </div>
    </form>
  );
}
