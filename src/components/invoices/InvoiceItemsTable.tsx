'use client';

import {
  FieldArrayWithId,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form';
import { CreateInvoiceInput } from '@/lib/validation/invoices';
import type { Product } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ProductAutocomplete } from './ProductAutocomplete';

interface InvoiceItemsTableProps {
  fields: FieldArrayWithId<CreateInvoiceInput, 'items', 'id'>[];
  register: UseFormRegister<CreateInvoiceInput>;
  watch: UseFormWatch<CreateInvoiceInput>;
  setValue: UseFormSetValue<CreateInvoiceInput>;
  products: Product[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

export function InvoiceItemsTable({
  fields,
  register,
  watch,
  setValue,
  products,
  onAddItem,
  onRemoveItem,
}: InvoiceItemsTableProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Item
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-4 items-end border-b pb-4"
            >
              <div className="col-span-5 space-y-2">
                <Label>Producto</Label>
                <ProductAutocomplete
                  products={products}
                  value={watch(`items.${index}.productId`)}
                  onChange={(productId) => {
                    setValue(`items.${index}.productId`, productId, {
                      shouldDirty: true,
                    });
                  }}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Precio Unit.</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Total</Label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                  {formatCurrency(
                    (watch(`items.${index}.quantity`) || 0) *
                      (watch(`items.${index}.unitPrice`) || 0),
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => onRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
