'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createInvoiceSchema,
  CreateInvoiceInput,
} from '@/lib/validation/invoices';
import { fetchCustomers } from '@/lib/api/customers';
import { fetchProducts } from '@/lib/api/products';
import { createInvoice, updateInvoice, InvoiceWithDetails } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Customer, InvoiceStatus } from '@prisma/client';
import type { Product } from '@/lib/api/products';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { CustomerSelect } from './CustomerSelect';

const DRAFT_STORAGE_KEY = 'invoice-create-draft';

interface InvoiceFormProps {
  initialData?: InvoiceWithDetails;
  isEditing?: boolean;
}

export default function InvoiceForm({ initialData, isEditing = false }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const defaultValues = useMemo(() => {
    if (initialData) {
      return {
        customerId: initialData.customerId,
        issueDate: new Date(initialData.issueDate),
        dueDate: new Date(initialData.dueDate),
        taxRate: Number(initialData.taxRate),
        status: initialData.status,
        notes: initialData.notes || '',
        items: initialData.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          description: item.description || '',
        })),
      };
    }
    return {
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      taxRate: 0.13,
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      status: InvoiceStatus.DRAFT,
    };
  }, [initialData]);

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema) as any,
    defaultValues,
  });

  // Reset form when initialData changes (important for edit mode fetching)
  useEffect(() => {
    if (initialData) {
      form.reset(defaultValues);
    }
  }, [initialData, defaultValues, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const taxRate = form.watch('taxRate');

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      }, 0),
    [items],
  );

  const taxAmount = useMemo(
    () => subtotal * (Number(taxRate) || 0),
    [subtotal, taxRate],
  );

  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  useEffect(() => {
    if (isEditing) return; // Don't load draft if editing an existing invoice

    const rawDraft = typeof window !== 'undefined'
      ? window.localStorage.getItem(DRAFT_STORAGE_KEY)
      : null;

    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft) as Partial<CreateInvoiceInput>;
        form.reset({
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          taxRate: 0.13,
          items: [{ productId: '', quantity: 1, unitPrice: 0 }],
          status: InvoiceStatus.DRAFT,
          ...parsed,
        });
      } catch {}
    }
  }, [form, isEditing]);

  useEffect(() => {
    async function loadData() {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetchCustomers({ limit: 100, isActive: true }),
          fetchProducts({ limit: 100, isActive: true }),
        ]);
        setCustomers(customersRes.data.customers);
        setProducts(productsRes.data);
      } catch {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los datos necesarios.',
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [toast]);

  useEffect(() => {
    if (isEditing) return; // Don't save draft if editing

    const interval = window.setInterval(() => {
      const values = form.getValues();
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
    }, 30000);

    return () => window.clearInterval(interval);
  }, [form, isEditing]);

  const handleSubmitDraft = useCallback(async (data: CreateInvoiceInput) => {
    try {
      if (isEditing && initialData) {
        await updateInvoice(initialData.id, { ...data, status: InvoiceStatus.DRAFT });
        toast({
          title: 'Factura actualizada',
          description: 'La factura se ha actualizado correctamente.',
        });
      } else {
        await createInvoice({ ...data, status: InvoiceStatus.DRAFT });
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        toast({
          title: 'Borrador guardado',
          description: 'La factura en borrador se ha guardado correctamente.',
        });
      }
      router.push('/invoices');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar la factura.',
      });
    }
  }, [isEditing, initialData, router, toast]);

  const handleSubmitSend = useCallback(async (data: CreateInvoiceInput) => {
    try {
      if (isEditing && initialData) {
        await updateInvoice(initialData.id, { ...data, status: InvoiceStatus.SENT });
        toast({
          title: 'Factura actualizada',
          description: 'La factura se ha actualizado y enviado correctamente.',
        });
      } else {
        await createInvoice({ ...data, status: InvoiceStatus.SENT });
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        toast({
          title: 'Factura enviada',
          description: 'La factura se ha creado y enviado correctamente.',
        });
      }
      router.push('/invoices');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo procesar la factura.',
      });
    }
  }, [isEditing, initialData, router, toast]);

  const onSubmitDraft = form.handleSubmit(handleSubmitDraft, (errors) => {
    toast({
      variant: 'destructive',
      title: 'Error de validación',
      description: 'Por favor complete todos los campos requeridos (Cliente y Productos).',
    });
  });

  const onSubmitSend = form.handleSubmit(handleSubmitSend, (errors) => {
    toast({
      variant: 'destructive',
      title: 'Error de validación',
      description: 'Por favor complete todos los campos requeridos (Cliente y Productos).',
    });
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      if (event.key === 's') {
        event.preventDefault();
        if (isEditing) {
           onSubmitDraft();
        } else {
          const values = form.getValues();
          window.localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify(values),
          );
          toast({
            title: 'Borrador guardado',
            description: 'Se guardó el borrador localmente.',
          });
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        onSubmitSend();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form, onSubmitSend, onSubmitDraft, isEditing, toast]);

  if (loadingData) return <div>Cargando datos...</div>;

  const selectedCustomer = customers.find(
    (c) => c.id === form.watch('customerId'),
  );

  return (
    <div className="space-y-8">
      <form className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <CustomerSelect
                  customers={customers}
                  value={form.watch('customerId')}
                  onChange={(id) => form.setValue('customerId', id)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Emisión</Label>
                  <Input
                    type="date"
                    {...form.register('issueDate', { valueAsDate: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Vencimiento</Label>
                  <Input
                    type="date"
                    {...form.register('dueDate', { valueAsDate: true })}
                  />
                </div>
              </div>
            </div>

            <InvoiceItemsTable
              fields={fields}
              register={form.register}
              watch={form.watch}
              setValue={form.setValue}
              products={products}
              onAddItem={() =>
                append({ productId: '', quantity: 1, unitPrice: 0 })
              }
              onRemoveItem={remove}
            />
          </div>

          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input
                  placeholder="Notas internas o términos de pago"
                  {...form.register('notes')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Impuestos (%):</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-20 h-8 text-right"
                    {...form.register('taxRate', { valueAsNumber: true })}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos:</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSubmitDraft}
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? isEditing ? 'Guardando...' : 'Guardando borrador...'
                    : isEditing ? 'Guardar cambios' : 'Guardar como borrador'}
                </Button>
                <Button
                  type="button"
                  onClick={onSubmitSend}
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? isEditing ? 'Enviando...' : 'Enviando factura...'
                    : isEditing ? 'Actualizar y Enviar' : 'Enviar ahora'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="text-lg font-semibold">Vista previa</h3>
              <div className="space-y-1 text-sm">
                <div className="font-medium">
                  {selectedCustomer ? selectedCustomer.name : 'Selecciona un cliente'}
                </div>
                <div className="text-muted-foreground">
                  Emisión: {form.watch('issueDate')?.toString()}
                </div>
                <div className="text-muted-foreground">
                  Vencimiento: {form.watch('dueDate')?.toString()}
                </div>
              </div>
              <div className="border-t pt-2 space-y-1 text-sm">
                {items.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  const lineTotal =
                    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  return (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex justify-between"
                    >
                      <span>
                        {product ? product.name : 'Producto sin seleccionar'} x{' '}
                        {item.quantity || 0}
                      </span>
                      <span>{formatCurrency(lineTotal)}</span>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-muted-foreground">
                    Agrega al menos un producto para ver la vista previa.
                  </div>
                )}
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total factura</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}


