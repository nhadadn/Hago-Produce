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
import { useLanguage } from '@/lib/i18n/useLanguage';

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
  customers = [],
  onSearchInputChange,
  onStatusChange,
  onCustomerChange,
  onStartDateChange,
  onEndDateChange,
}: InvoiceFiltersProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.invoices.searchPlaceholder}
            className="pl-8"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as InvoiceStatus | 'ALL')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t.invoices.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.invoices.allStatuses}</SelectItem>
            {Object.values(InvoiceStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {t.invoices.statusLabels[status as keyof typeof t.invoices.statusLabels]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={customerId}
          onValueChange={(value) => onCustomerChange(value as string | 'ALL')}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder={t.invoices.filterByCustomer} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.invoices.allCustomers}</SelectItem>
            {customers && customers.length > 0 && customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium whitespace-nowrap">{t.invoices.from}</span>
          <Input
            type="date"
            className="flex-1"
            value={startDate ?? ''}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium whitespace-nowrap">{t.invoices.to}</span>
          <Input
            type="date"
            className="flex-1"
            value={endDate ?? ''}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

