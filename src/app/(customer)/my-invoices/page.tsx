'use client';

import InvoiceList from '@/components/invoices/InvoiceList';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function MyInvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Mis Facturas</h1>
        <p className="text-muted-foreground">
          Historial de facturas y estados de pago.
        </p>
      </div>
      <InvoiceList />
    </div>
  );
}
