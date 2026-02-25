import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Users, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardsProps {
  stats?: {
    totalInvoiced: number;
    pendingInvoices: number;
    overdueInvoices: number;
    activeCustomers?: number;
  };
  isLoading?: boolean;
}

export function SummaryCards({ stats, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const summaryData = [
    {
      title: "Total Facturado",
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalInvoiced),
      description: "Acumulado histórico",
      icon: DollarSign,
    },
    {
      title: "Pendientes de Pago",
      value: stats.pendingInvoices.toString(),
      description: "Facturas enviadas o pendientes",
      icon: FileText,
    },
    {
      title: "Vencidas",
      value: stats.overdueInvoices.toString(),
      description: "Requieren atención inmediata",
      icon: AlertTriangle,
    },
    ...(stats.activeCustomers !== undefined ? [{
      title: "Clientes Activos",
      value: stats.activeCustomers.toString(),
      description: "Total registrados",
      icon: Users,
    }] : []),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryData.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
