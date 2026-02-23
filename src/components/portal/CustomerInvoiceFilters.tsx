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

interface Props {
  status: InvoiceStatus | 'ALL';
  startDate?: string;
  endDate?: string;
  onStatusChange: (value: InvoiceStatus | 'ALL') => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function CustomerInvoiceFilters({ status, startDate, endDate, onStatusChange, onStartDateChange, onEndDateChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label>Estado</Label>
        <Select value={status} onValueChange={onStatusChange as any}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value={InvoiceStatus.DRAFT}>Borrador</SelectItem>
            <SelectItem value={InvoiceStatus.SENT}>Enviado</SelectItem>
            <SelectItem value={InvoiceStatus.PAID}>Pagado</SelectItem>
            <SelectItem value={InvoiceStatus.OVERDUE}>Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Desde</Label>
        <Input type="date" value={startDate || ''} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Hasta</Label>
        <Input type="date" value={endDate || ''} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>
    </div>
  );
}

