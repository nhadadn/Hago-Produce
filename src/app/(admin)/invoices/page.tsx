'use client';

import InvoiceList from '@/components/invoices/InvoiceList';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useLanguage } from '@/lib/i18n';

export default function InvoicesPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">{t.invoices.title}</h1>
        <p className="text-muted-foreground">
          {t.invoices.managementDescription}
        </p>
      </div>
      <InvoiceList />
    </div>
  );
}
