import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { InvoiceDetail } from '@/components/invoices/InvoiceDetail';

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Detalle de factura</h1>
        <p className="text-muted-foreground">
          Revisión detallada de items, totales, historial de estado y notas internas.
        </p>
      </div>
      <InvoiceDetail invoiceId={params.id} />
    </div>
  );
}

