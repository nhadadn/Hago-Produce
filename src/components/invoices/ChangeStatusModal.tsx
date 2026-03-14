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
import { useLanguage } from '@/lib/i18n';

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
  const { t } = useLanguage();

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
          setError(err?.message || t.invoices.changeStatus.invoiceNotFound);
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
        return 'bg-hago-primary-100 text-hago-primary-800';
      case InvoiceStatus.DRAFT:
        return 'bg-hago-gray-200 text-hago-gray-700';
      case InvoiceStatus.OVERDUE:
        return 'bg-hago-error/10 text-hago-error';
      case InvoiceStatus.PENDING:
        return 'bg-hago-warning/10 text-hago-warning';
      case InvoiceStatus.SENT:
        return 'bg-hago-info/10 text-hago-info';
      default:
        return 'bg-hago-info/10 text-hago-info';
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
        title: t.invoices.changeStatus.successTitle,
        description: t.invoices.changeStatus.successDesc,
      });

      onClose();
    } catch (err: any) {
      toast({
        title: t.invoices.changeStatus.errorTitle,
        description: err?.message || t.invoices.changeStatus.errorDesc,
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
          <DialogTitle>{t.invoices.changeStatus.modalTitle}</DialogTitle>
          <DialogDescription>
            {t.invoices.changeStatus.modalDescription}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t.invoices.changeStatus.loadingInvoice}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !invoice ? (
          <p className="text-sm text-muted-foreground">{t.invoices.changeStatus.invoiceNotFound}</p>
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
                  {t.invoices.statusLabels[invoice.status as keyof typeof t.invoices.statusLabels] || invoice.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.invoices.issuance} {formatDate(invoice.issueDate as unknown as string)} · {t.invoices.dueLabel}{' '}
                {formatDate(invoice.dueDate as unknown as string)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t.invoices.changeStatus.newStatus}</p>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value) => setSelectedStatus(value as InvoiceStatus)}
                disabled={allowedStatuses.length === 0 || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.invoices.changeStatus.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t.invoices.statusLabels[status as keyof typeof t.invoices.statusLabels] || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allowedStatuses.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.invoices.changeStatus.noTransitions}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t.invoices.changeStatus.reason}</p>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.invoices.changeStatus.reasonPlaceholder}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                {t.invoices.changeStatus.recommendedNote}
              </p>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-medium">{t.invoices.changeStatus.changeSummary}</p>
              {selectedStatus ? (
                <p>
                  {t.invoices.changeStatus.summaryText
                    .replace('{number}', invoice.number)
                    .replace('{from}', t.invoices.statusLabels[invoice.status as keyof typeof t.invoices.statusLabels] || invoice.status)
                    .replace('{to}', t.invoices.statusLabels[selectedStatus as keyof typeof t.invoices.statusLabels] || selectedStatus)}
                </p>
              ) : (
                <p>{t.invoices.changeStatus.summarySelectPrompt}</p>
              )}
              {reason && (
                <p className="text-xs text-muted-foreground">
                  {t.invoices.changeStatus.reasonProvided} {reason}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !invoice || !selectedStatus}
          >
            {submitting ? t.invoices.changeStatus.saving : t.invoices.changeStatus.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
