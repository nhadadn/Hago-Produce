import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AutocompleteProduct {
  id: string
  name: string
  sku?: string | null
}

interface ProductAutocompleteProps {
  products: AutocompleteProduct[]
  value?: string
  onChange: (productId: string) => void
  placeholder?: string
}

const normalize = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function ProductAutocomplete({
  products,
  value,
  onChange,
  placeholder = 'Seleccionar producto',
}: ProductAutocompleteProps) {
  const [open, setOpen] = React.useState(false)

  const selectedProduct = products.find((p) => p.id === value) || null

  const filterProduct = (value: string, search: string) => {
    const normalizedSearch = normalize(search)
    // We can search by name or SKU. 
    // The value passed here by Command is usually the "value" prop of CommandItem.
    // So we should include both name and SKU in the CommandItem value or handle logic here.
    // However, cmdk default filter is usually fine if we put all text in value, 
    // but for accent support we use our normalize logic.
    const normalizedValue = normalize(value)
    return normalizedValue.includes(normalizedSearch) ? 1 : 0
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedProduct && "text-muted-foreground"
          )}
        >
          {selectedProduct
            ? `${selectedProduct.name}${selectedProduct.sku ? ` (${selectedProduct.sku})` : ''}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command filter={filterProduct}>
          <CommandInput placeholder="Buscar por nombre o SKU..." />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.sku ?? ''}`}
                  onSelect={() => {
                    onChange(product.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      product.id === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    {product.sku && (
                      <span className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
