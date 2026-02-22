'use client';

import { useState, useMemo } from 'react';
import type { Product } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductAutocompleteProps {
  products: Product[];
  value?: string;
  onChange: (productId: string) => void;
  placeholder?: string;
}

export function ProductAutocomplete({
  products,
  value,
  onChange,
  placeholder = 'Seleccionar producto',
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === value) || null,
    [products, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between',
            !selectedProduct && 'text-muted-foreground',
          )}
       >
          {selectedProduct
            ? `${selectedProduct.name}${selectedProduct.sku ? ` (${selectedProduct.sku})` : ''}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar por nombre o SKU..." />
          <CommandEmpty>No se encontraron productos.</CommandEmpty>
          <CommandGroup>
            {products.map((product) => (
              <CommandItem
                key={product.id}
                value={`${product.name} ${product.sku ?? ''}`}
                onSelect={() => {
                  onChange(product.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    product.id === value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="font-medium">{product.name}</span>
                {product.sku && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {product.sku}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
