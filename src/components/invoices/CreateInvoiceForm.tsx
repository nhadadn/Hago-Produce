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
import { useLanguage } from '@/lib/i18n';

const DRAFT_STORAGE_KEY = 'invoice-create-draft';

interface InvoiceFormProps {
  initialData?: InvoiceWithDetails;
  isEditing?: boolean;
}

export default function InvoiceForm({ initialData, isEditing = false }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
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
          description: t.invoices.errorLoadingData,
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
          title: t.invoices.invoiceUpdatedTitle,
          description: t.invoices.invoiceUpdatedDesc,
        });
      } else {
        await createInvoice({ ...data, status: InvoiceStatus.DRAFT });
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        toast({
          title: t.invoices.draftSavedTitle,
          description: t.invoices.draftSavedDesc,
        });
      }
      router.push('/invoices');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || t.invoices.errorSaving,
      });
    }
  }, [isEditing, initialData, router, toast, t]);

  const handleSubmitSend = useCallback(async (data: CreateInvoiceInput) => {
    try {
      if (isEditing && initialData) {
        await updateInvoice(initialData.id, { ...data, status: InvoiceStatus.SENT });
        toast({
          title: t.invoices.invoiceUpdatedTitle,
          description: t.invoices.invoiceUpdatedSentDesc,
        });
      } else {
        await createInvoice({ ...data, status: InvoiceStatus.SENT });
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        toast({
          title: t.invoices.invoiceSentTitle,
          description: t.invoices.invoiceSentDesc,
        });
      }
      router.push('/invoices');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || t.invoices.errorProcessing,
      });
    }
  }, [isEditing, initialData, router, toast, t]);

  const onSubmitDraft = form.handleSubmit(handleSubmitDraft, () => {
    toast({
      variant: 'destructive',
      title: t.invoices.validationErrorTitle,
      description: t.invoices.validationErrorDesc,
    });
  });

  const onSubmitSend = form.handleSubmit(handleSubmitSend, () => {
    toast({
      variant: 'destructive',
      title: t.invoices.validationErrorTitle,
      description: t.invoices.validationErrorDesc,
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
            title: t.invoices.draftSavedTitle,
            description: t.invoices.draftSavedLocalDesc,
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

  if (loadingData) return <div>{t.invoices.loadingData}</div>;

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
                <Label>{t.invoices.customer}</Label>
                <CustomerSelect
                  customers={customers}
                  value={form.watch('customerId')}
                  onChange={(id) => form.setValue('customerId', id)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.invoices.issueDate}</Label>
                  <Input
                    type="date"
                    {...form.register('issueDate', { valueAsDate: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.invoices.dueDate}</Label>
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
                <Label>{t.invoices.notes}</Label>
                <Input
                  placeholder={t.invoices.notesPlaceholder}
                  {...form.register('notes')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.invoices.subtotal}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>{t.invoices.taxes}</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-20 h-8 text-right"
                    {...form.register('taxRate', { valueAsNumber: true })}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t.invoices.taxAmount}</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>{t.invoices.totalLabel}</span>
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
                    ? isEditing ? t.invoices.savingChanges : t.invoices.savingDraft
                    : isEditing ? t.invoices.saveChanges : t.invoices.saveAsDraft}
                </Button>
                <Button
                  type="button"
                  onClick={onSubmitSend}
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? isEditing ? t.common.sending : t.invoices.sendingInvoice
                    : isEditing ? t.invoices.updateAndSend : t.invoices.sendNow}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="text-lg font-semibold">{t.invoices.preview}</h3>
              <div className="space-y-1 text-sm">
                <div className="font-medium">
                  {selectedCustomer ? selectedCustomer.name : t.invoices.selectCustomer}
                </div>
                <div className="text-muted-foreground">
                  {t.invoices.issuance}: {form.watch('issueDate')?.toString()}
                </div>
                <div className="text-muted-foreground">
                  {t.invoices.dueLabel}: {form.watch('dueDate')?.toString()}
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
                        {product ? product.name : t.invoices.noProductSelected} x{' '}
                        {item.quantity || 0}
                      </span>
                      <span>{formatCurrency(lineTotal)}</span>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-muted-foreground">
                    {t.invoices.addProductPrompt}
                  </div>
                )}
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>{t.invoices.totalInvoice}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}


