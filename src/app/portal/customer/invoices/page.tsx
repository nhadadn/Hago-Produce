"use client";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CustomerInvoicesTable } from "@/components/portal/CustomerInvoicesTable";

export default function CustomerInvoicesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Mis Facturas</h1>
        <p className="text-muted-foreground">Historial de facturas y estados de pago.</p>
      </div>
      <CustomerInvoicesTable />
    </div>
  );
}

