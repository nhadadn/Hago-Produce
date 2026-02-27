"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Role } from "@prisma/client";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { IncomeChart } from "@/components/dashboard/IncomeChart";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { CustomerDashboardSummary } from "@/components/portal/CustomerDashboardSummary";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === Role.CUSTOMER) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu actividad de facturación.</p>
        </div>
        <CustomerDashboardSummary />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <SummaryCards />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <IncomeChart />
        <RecentInvoices />
      </div>
    </div>
  );
}
