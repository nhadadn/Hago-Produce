import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Users, Truck } from "lucide-react";

const summaryData = [
  {
    title: "Total Facturado",
    value: "$125,231.89",
    description: "+20.1% desde el mes pasado",
    icon: DollarSign,
  },
  {
    title: "Facturas Pendientes",
    value: "12",
    description: "4 vencen hoy",
    icon: FileText,
  },
  {
    title: "Clientes Activos",
    value: "24",
    description: "+2 nuevos este mes",
    icon: Users,
  },
  {
    title: "Proveedores",
    value: "8",
    description: "Activos en la plataforma",
    icon: Truck,
  },
];

export function SummaryCards() {
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
