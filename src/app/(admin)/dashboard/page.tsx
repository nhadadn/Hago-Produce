import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { IncomeChart } from "@/components/dashboard/IncomeChart";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";

export default function DashboardPage() {
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
