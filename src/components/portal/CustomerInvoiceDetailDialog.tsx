'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchInvoice, InvoiceWithDetails } from '@/lib/api/invoices';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { InvoiceStatus } from '@prisma/client';
import { CustomerDownloadPDFButton } from './CustomerDownloadPDFButton';
import { CustomerPDFPreview } from './CustomerPDFPreview';
import { useLanguage } from '@/lib/i18n/useLanguage';

interface Props {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerInvoiceDetailDialog({ invoiceId, open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!open || !invoiceId) return;
      setLoading(true);
      try {
        const inv = await fetchInvoice(invoiceId);
        if (!cancelled) setInvoice(inv);
      } catch {
        if (!cancelled) setInvoice(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-hago-primary-100 text-hago-primary-800';
      case 'DRAFT':
        return 'bg-hago-gray-200 text-hago-gray-700';
      case 'OVERDUE':
        return 'bg-hago-error/10 text-hago-error';
      case 'PENDING':
        return 'bg-hago-warning/10 text-hago-warning';
      default:
        return 'bg-hago-info/10 text-hago-info';
    }
  };

  const totals = useMemo(() => {
    if (!invoice) return { subtotal: 0, taxRate: 0, taxAmount: 0, total: 0 };
    return {
      subtotal: Number(invoice.subtotal ?? 0),
      taxRate: Number(invoice.taxRate ?? 0),
      taxAmount: Number(invoice.taxAmount ?? 0),
      total: Number(invoice.total ?? 0),
    };
  }, [invoice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t.common.detail}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : !invoice ? (
          <p className="text-sm text-muted-foreground">{t.invoices.changeStatus.invoiceNotFound}</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">{invoice.number}</h2>
                  <Badge className={cn(getStatusColor(invoice.status), 'uppercase')} variant="secondary">
                    {t.invoices.statusLabels[invoice.status as keyof typeof t.invoices.statusLabels] || invoice.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{invoice.customer?.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CustomerDownloadPDFButton invoiceId={invoice.id} variant="outline" size="sm">
                  {t.portal.downloadPdf}
                </CustomerDownloadPDFButton>
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                  {t.invoices.preview}
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t.nav.products}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="py-2 text-left font-medium">{t.products.name}</th>
                          <th className="py-2 text-right font-medium">{t.dashboard.amount}</th>
                          <th className="py-2 text-right font-medium">{t.prices.sellPrice}</th>
                          <th className="py-2 text-right font-medium">{t.dashboard.amount}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-2">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.product?.name ?? 'Producto'}</span>
                                {item.product?.sku && (
                                  <span className="text-xs text-muted-foreground">{item.product.sku}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-right">{Number(item.quantity)}</td>
                            <td className="py-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                            <td className="py-2 text-right">
                              {formatCurrency(
                                Number((item as any).totalPrice ?? Number(item.quantity) * Number(item.unitPrice)),
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.invoices.totalLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.invoices.subtotal}</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.invoices.taxAmount} ({(totals.taxRate * 100).toFixed(2)}%)</span>
                    <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
                    <span>{t.invoices.totalLabel}</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">{t.invoices.issuance}:</span> {formatDate(invoice.issueDate as unknown as string)}
                    </div>
                    <div>
                      <span className="font-medium">{t.invoices.dueLabel}:</span> {formatDate(invoice.dueDate as unknown as string)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {invoice && (
          <CustomerPDFPreview invoiceId={invoice.id} open={previewOpen} onOpenChange={setPreviewOpen} />
        )}
      </DialogContent>
    </Dialog>
  );
}

