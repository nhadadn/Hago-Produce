import { Metadata } from 'next';
import { CustomerDashboardSummary } from '@/components/portal/CustomerDashboardSummary';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Mi Dashboard',
};

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Mi Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de tu actividad de facturación.
        </p>
      </div>
      <CustomerDashboardSummary />
    </div>
  );
}
