'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { changeInvoiceStatus, fetchInvoice, InvoiceWithDetails } from '@/lib/api/invoices';
import { InvoiceStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

interface ChangeStatusModalProps {
  invoiceId: string;
  open: boolean;
  onClose: () => void;
}

export function ChangeStatusModal({ invoiceId, open, onClose }: ChangeStatusModalProps) {
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const loadInvoice = async () => {
      if (!open) return;

      setLoading(true);
      setError(null);
      try {
        const data = await fetchInvoice(invoiceId);
        if (!cancelled) {
          setInvoice(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'No se pudo cargar la factura.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInvoice();

    return () => {
      cancelled = true;
    };
  }, [invoiceId, open]);

  const allowedStatuses = useMemo(() => {
    if (!invoice) return [] as InvoiceStatus[];

    switch (invoice.status) {
      case InvoiceStatus.DRAFT:
        return [InvoiceStatus.SENT, InvoiceStatus.PAID];
      case InvoiceStatus.SENT:
        return [InvoiceStatus.PAID, InvoiceStatus.OVERDUE];
      case InvoiceStatus.OVERDUE:
        return [InvoiceStatus.PAID];
      default:
        return [];
    }
  }, [invoice]);

  useEffect(() => {
    if (allowedStatuses.length > 0) {
      setSelectedStatus(allowedStatuses[0]);
    } else {
      setSelectedStatus('');
    }
  }, [allowedStatuses]);

  const getStatusBadgeClass = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case InvoiceStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleConfirm = async () => {
    if (!invoice || !selectedStatus) return;

    setSubmitting(true);
    try {
      await changeInvoiceStatus(invoice.id, {
        status: selectedStatus,
        reason: reason || undefined,
      });

      toast({
        title: 'Estado actualizado',
        description: 'El estado de la factura se actualizó correctamente.',
      });

      onClose();
    } catch (err: any) {
      toast({
        title: 'Error al cambiar estado',
        description: err?.message || 'No se pudo cambiar el estado de la factura.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cambiar estado de factura</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo estado y revisa el cambio antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando factura...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !invoice ? (
          <p className="text-sm text-muted-foreground">Factura no encontrada.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{invoice.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.customer?.name}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(getStatusBadgeClass(invoice.status), 'uppercase')}
                >
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Emisión {formatDate(invoice.issueDate as unknown as string)} · Vencimiento{' '}
                {formatDate(invoice.dueDate as unknown as string)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Nuevo estado</p>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value) => setSelectedStatus(value as InvoiceStatus)}
                disabled={allowedStatuses.length === 0 || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allowedStatuses.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay transiciones de estado disponibles para esta factura.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Razón del cambio (opcional)</p>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo del cambio de estado (visible solo internamente)."
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado para cambios críticos, como marcar una factura como pagada o vencida.
              </p>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-medium">Resumen del cambio</p>
              {selectedStatus ? (
                <p>
                  La factura
                  <span className="font-semibold"> {invoice.number} </span>
                  cambiará de
                  <span className="font-semibold"> {invoice.status} </span>
                  a
                  <span className="font-semibold"> {selectedStatus} </span>.
                </p>
              ) : (
                <p>Selecciona un nuevo estado para ver el resumen del cambio.</p>
              )}
              {reason && (
                <p className="text-xs text-muted-foreground">
                  Razón proporcionada: {reason}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !invoice || !selectedStatus}
          >
            {submitting ? 'Guardando...' : 'Confirmar cambio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

