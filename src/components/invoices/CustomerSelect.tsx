import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Customer } from "@prisma/client"

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

interface CustomerSelectProps {
  customers: Customer[]
  value?: string
  onChange: (id: string) => void
}

const normalize = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function CustomerSelect({ customers, value, onChange }: CustomerSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selected = customers.find((c) => c.id === value) || null

  const filterCustomer = (value: string, search: string) => {
    const normalizedValue = normalize(value)
    const normalizedSearch = normalize(search)
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
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? selected.name : "Seleccionar cliente"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command filter={filterCustomer}>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => {
                    onChange(customer.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      customer.id === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    {customer.email && (
                      <span className="text-xs text-muted-foreground">
                        {customer.email}
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
