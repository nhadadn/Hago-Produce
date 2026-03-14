'use client';

import { InvoiceStatus } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface Props {
  status: InvoiceStatus | 'ALL';
  startDate?: string;
  endDate?: string;
  onStatusChange: (value: InvoiceStatus | 'ALL') => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function CustomerInvoiceFilters({ status, startDate, endDate, onStatusChange, onStartDateChange, onEndDateChange }: Props) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label>{t.common.status}</Label>
        <Select value={status} onValueChange={onStatusChange as any}>
          <SelectTrigger>
            <SelectValue placeholder={t.invoices.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.common.all}</SelectItem>
            <SelectItem value={InvoiceStatus.DRAFT}>{t.invoices.statusLabels.DRAFT}</SelectItem>
            <SelectItem value={InvoiceStatus.PENDING}>{t.invoices.statusLabels.PENDING}</SelectItem>
            <SelectItem value={InvoiceStatus.SENT}>{t.invoices.statusLabels.SENT}</SelectItem>
            <SelectItem value={InvoiceStatus.PAID}>{t.invoices.statusLabels.PAID}</SelectItem>
            <SelectItem value={InvoiceStatus.OVERDUE}>{t.invoices.statusLabels.OVERDUE}</SelectItem>
            <SelectItem value={InvoiceStatus.CANCELLED}>{t.invoices.statusLabels.CANCELLED}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t.invoices.from}</Label>
        <Input type="date" value={startDate || ''} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>{t.invoices.to}</Label>
        <Input type="date" value={endDate || ''} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>
    </div>
  );
}

