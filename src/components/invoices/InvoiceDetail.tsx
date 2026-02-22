'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchInvoice, InvoiceWithDetails } from '@/lib/api/invoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { StatusHistory, StatusHistoryEntry } from '@/components/invoices/StatusHistory';
import { InternalNotes } from '@/components/invoices/InternalNotes';
import { DownloadPDFButton } from '@/components/invoices/DownloadPDFButton';
import { PDFPreview } from '@/components/invoices/PDFPreview';
import { useAuth } from '@/lib/hooks/useAuth';
import { InvoiceStatus, Role } from '@prisma/client';
import { Pencil, ArrowRightLeft } from 'lucide-react';

interface InvoiceDetailProps {
  invoiceId: string;
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const loadInvoice = async () => {
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
  }, [invoiceId]);

  const canEdit = useMemo(() => {
    if (!invoice || !user) return false;
    if (user.role === Role.CUSTOMER) return false;
    return invoice.status === InvoiceStatus.DRAFT;
  }, [invoice, user]);

  const canChangeStatus = useMemo(() => {
    if (!user) return false;
    return user.role === Role.ADMIN || user.role === Role.ACCOUNTING;
  }, [user]);

  const statusHistoryEntries: StatusHistoryEntry[] = useMemo(() => {
    if (!invoice) return [];

    const entries: StatusHistoryEntry[] = [];

    if (invoice.createdAt) {
      entries.push({
        id: 'created',
        date: invoice.createdAt as unknown as string,
        status: 'Creada',
        description: `Factura creada con estado ${invoice.status}`,
      });
    }

    return entries;
  }, [invoice]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleEdit = () => {
    if (!invoice) return;
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleChangeStatus = () => {
    if (!invoice) return;
    router.push(`/accounting/invoices/${invoice.id}/status`);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando factura...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!invoice) {
    return <p className="text-sm text-muted-foreground">Factura no encontrada.</p>;
  }

  const subtotal = Number(invoice.subtotal ?? 0);
  const taxRate = Number(invoice.taxRate ?? 0);
  const taxAmount = Number(invoice.taxAmount ?? 0);
  const total = Number(invoice.total ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{invoice.number}</h2>
            <Badge className={cn(getStatusColor(invoice.status), 'uppercase')} variant="secondary">
              {invoice.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.customer?.name}
          </p>
          {invoice.customer?.email && (
            <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <DownloadPDFButton
            invoiceId={invoice.id}
            variant="outline"
            size="sm"
          >
            Descargar PDF
          </DownloadPDFButton>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
          >
            Ver PDF
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Pencil className="mr-2 h-4 w-4" /> Editar borrador
            </Button>
          )}
          {canChangeStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangeStatus}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Cambiar estado
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Producto</th>
                    <th className="py-2 text-right font-medium">Cantidad</th>
                    <th className="py-2 text-right font-medium">Precio unitario</th>
                    <th className="py-2 text-right font-medium">Total línea</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {item.product?.name ?? 'Producto'}
                          </span>
                          {item.product?.sku && (
                            <span className="text-xs text-muted-foreground">
                              {item.product.sku}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(Number((item as any).totalPrice ?? item.quantity * item.unitPrice))}
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
            <CardTitle>Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impuesto ({(taxRate * 100).toFixed(2)}%)</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Emisión:</span>{' '}
                {formatDate(invoice.issueDate as unknown as string)}
              </div>
              <div>
                <span className="font-medium">Vencimiento:</span>{' '}
                {formatDate(invoice.dueDate as unknown as string)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historial de estado</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusHistory entries={statusHistoryEntries} />
          </CardContent>
        </Card>

        <InternalNotes invoiceId={invoice.id} />
      </div>

      <PDFPreview
        invoiceId={invoice.id}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
