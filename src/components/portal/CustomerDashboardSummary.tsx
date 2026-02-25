"use client";

import { useCustomerAuth } from "@/lib/hooks/useCustomerAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerDashboardData } from "@/lib/hooks/useCustomerDashboardData";
import { RevenueBarChart } from "@/components/portal/charts/RevenueBarChart";
import { InvoiceStatusDoughnut } from "@/components/portal/charts/InvoiceStatusDoughnut";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, DollarSign, FileText, AlertCircle, ShoppingBag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomerDashboardSummary() {
  const { customer } = useCustomerAuth();
  const { data, loading, error } = useCustomerDashboardData(customer?.id || "");

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Error al cargar el dashboard</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Facturado (Mes)"
          value={`$${data.summary.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          trend={data.summary.revenueGrowth}
          icon={DollarSign}
        />
        <KpiCard
          title="Balance Pendiente"
          value={`$${data.summary.pendingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon={FileText}
          subtext="Facturas enviadas y vencidas"
        />
        <KpiCard
          title="Facturas Vencidas"
          value={data.summary.overdueCount.toString()}
          icon={AlertCircle}
          variant="danger"
          subtext={data.summary.overdueCount > 0 ? "Requiere atención inmediata" : "Al día"}
        />
        <KpiCard
          title="Total Órdenes"
          value={data.summary.totalInvoices.toString()}
          icon={ShoppingBag}
          subtext="Histórico total"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Facturación Mensual</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 h-[350px]">
                <RevenueBarChart data={data.revenueHistory} />
            </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Estado de Facturas</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center">
                <div className="w-full h-full max-w-[300px]">
                    <InvoiceStatusDoughnut data={data.statusDistribution} />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, trend, icon: Icon, subtext, variant = "default" }: any) {
    const isDanger = variant === 'danger' && parseInt(value) > 0;
    
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-muted-foreground ${isDanger ? 'text-hago-error' : ''}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${isDanger ? 'text-hago-error' : 'text-gray-900'}`}>{value}</div>
                {trend !== undefined ? (
                    <p className="text-xs text-muted-foreground flex items-center pt-1">
                        {trend > 0 ? (
                            <span className="text-hago-primary-600 flex items-center font-medium mr-1">
                                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                {trend}%
                            </span>
                        ) : (
                            <span className="text-hago-error flex items-center font-medium mr-1">
                                <ArrowDownRight className="h-3 w-3 mr-0.5" />
                                {Math.abs(trend)}%
                            </span>
                        )}
                        <span className="ml-1">vs mes anterior</span>
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground pt-1">{subtext}</p>
                )}
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px] mb-2" />
                            <Skeleton className="h-3 w-[120px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-6 w-[150px]" />
                    </CardHeader>
                    <CardContent className="h-[350px] p-6">
                        <Skeleton className="h-full w-full rounded-lg" />
                    </CardContent>
                </Card>
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-6 w-[150px]" />
                    </CardHeader>
                    <CardContent className="h-[350px] p-6 flex justify-center items-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
