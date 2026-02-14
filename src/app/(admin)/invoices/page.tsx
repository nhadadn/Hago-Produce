import InvoiceList from '@/components/invoices/InvoiceList';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
        <p className="text-muted-foreground">
          Gestione las facturas de clientes, estados y vencimientos.
        </p>
      </div>
      <InvoiceList />
    </div>
  );
}
