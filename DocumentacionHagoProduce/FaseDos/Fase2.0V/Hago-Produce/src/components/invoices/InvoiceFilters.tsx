'use client';

import { InvoiceStatus } from '@prisma/client';
import type { Customer } from '@prisma/client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface InvoiceFiltersProps {
  searchInput: string;
  status: InvoiceStatus | 'ALL';
  customerId: string | 'ALL';
  startDate?: string;
  endDate?: string;
  customers: Customer[];
  onSearchInputChange: (value: string) => void;
  onStatusChange: (value: InvoiceStatus | 'ALL') => void;
  onCustomerChange: (value: string | 'ALL') => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function InvoiceFilters({
  searchInput,
  status,
  customerId,
  startDate,
  endDate,
  customers,
  onSearchInputChange,
  onStatusChange,
  onCustomerChange,
  onStartDateChange,
  onEndDateChange,
}: InvoiceFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o cliente..."
              className="pl-8"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => onStatusChange(value as InvoiceStatus | 'ALL')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {Object.values(InvoiceStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={customerId}
            onValueChange={(value) => onCustomerChange(value as string | 'ALL')}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los clientes</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 flex-1">
            <Input
              type="date"
              className="flex-1"
              value={startDate ?? ''}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
            <Input
              type="date"
              className="flex-1"
              value={endDate ?? ''}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

