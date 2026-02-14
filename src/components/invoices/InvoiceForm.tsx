'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvoiceSchema, CreateInvoiceInput } from '@/lib/validation/invoices';
import { fetchCustomers, CustomersResponse } from '@/lib/api/customers';
import { fetchProducts, ProductsResponse } from '@/lib/api/products';
import { createInvoice } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Product, Customer } from '@prisma/client';

export default function InvoiceForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      taxRate: 0.13,
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      status: 'DRAFT',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Watch values for live calculations
  const items = form.watch('items');
  const taxRate = form.watch('taxRate');

  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  const taxAmount = subtotal * (Number(taxRate) || 0);
  const total = subtotal + taxAmount;

  useEffect(() => {
    async function loadData() {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetchCustomers({ limit: 100, isActive: true }),
          fetchProducts({ limit: 100, isActive: true }),
        ]);
        setCustomers(customersRes.data.data);
        setProducts(productsRes.data); // productsRes.data is Product[] based on fetchProducts return type
      } catch (error) {
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
  }, []);

  const onProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        // Here we could fetch price from product-prices if implemented
        // For now defaulting to 0 or product base price if available
        form.setValue(`items.${index}.productId`, productId);
        // If product has a base price field, set it here. 
        // Our Product interface in `src/lib/api/products.ts` doesn't show price, 
        // assuming manual entry or separate price lookup.
    }
  };

  const onSubmit = async (data: CreateInvoiceInput) => {
    try {
      await createInvoice(data);
      toast({
        title: 'Factura creada',
        description: 'La factura se ha guardado correctamente.',
      });
      router.push('/invoices');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear la factura.',
      });
    }
  };

  if (loadingData) return <div>Cargando datos...</div>;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select
            onValueChange={(value) => form.setValue('customerId', value)}
            defaultValue={form.getValues('customerId')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.customerId && (
            <p className="text-sm text-red-500">{form.formState.errors.customerId.message}</p>
          )}
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

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                <div className="col-span-5 space-y-2">
                  <Label>Producto</Label>
                  <Select
                    onValueChange={(val) => onProductSelect(index, val)}
                    defaultValue={field.productId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.items?.[index]?.productId && (
                    <p className="text-xs text-red-500">{form.formState.errors.items[index]?.productId?.message}</p>
                  )}
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Precio Unit.</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Total</Label>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                    {formatCurrency(
                      (form.watch(`items.${index}.quantity`) || 0) * 
                      (form.watch(`items.${index}.unitPrice`) || 0)
                    )}
                  </div>
                </div>

                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-2">
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
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Factura'}
        </Button>
      </div>
    </form>
  );
}
