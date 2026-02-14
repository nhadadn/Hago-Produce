import InvoiceForm from '@/components/invoices/InvoiceForm';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Nueva Factura</h1>
        <p className="text-muted-foreground">
          Cree una nueva factura para un cliente existente.
        </p>
      </div>
      <div className="max-w-4xl">
        <InvoiceForm />
      </div>
    </div>
  );
}
