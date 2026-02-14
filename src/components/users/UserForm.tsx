import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role } from '@prisma/client';
import { useState } from 'react';

// Using the same schema as backend but adapted for form
const userFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.nativeEnum(Role),
  isActive: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: any;
  onSubmit: (data: UserFormValues) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function UserForm({ initialData, onSubmit, onCancel, isEditing = false }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: initialData?.email || '',
      password: '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      role: initialData?.role || Role.MANAGEMENT,
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: UserFormValues) => {
    setLoading(true);
    setError(null);
    try {
      // If editing and password is empty, remove it (backend handles optional password update)
      if (isEditing && !data.password) {
        delete data.password;
      }
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
          <Label htmlFor="firstName">Nombre</Label>
          <Input id="firstName" {...form.register('firstName')} />
          {form.formState.errors.firstName && (
            <p className="text-red-500 text-xs">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input id="lastName" {...form.register('lastName')} />
          {form.formState.errors.lastName && (
            <p className="text-red-500 text-xs">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} disabled={isEditing} />
        {form.formState.errors.email && (
          <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{isEditing ? 'Contraseña (Dejar en blanco para no cambiar)' : 'Contraseña'}</Label>
        <Input id="password" type="password" {...form.register('password')} required={!isEditing} />
        {form.formState.errors.password && (
          <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select 
          onValueChange={(value) => form.setValue('role', value as Role)} 
          defaultValue={form.getValues('role')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Role).map((role) => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.role && (
          <p className="text-red-500 text-xs">{form.formState.errors.role.message}</p>
        )}
      </div>

      {isEditing && (
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="isActive" 
            {...form.register('isActive')} 
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive">Activo</Label>
        </div>
      )}

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
