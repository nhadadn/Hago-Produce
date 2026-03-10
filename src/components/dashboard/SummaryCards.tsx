'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Users, Truck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function SummaryCards() {
  const { t } = useLanguage();

  const summaryData = [
    {
      title: t.dashboard.totalBilled,
      value: "$125,231.89",
      description: t.dashboard.sinceLastMonth,
      icon: DollarSign,
    },
    {
      title: t.dashboard.pendingInvoices,
      value: "12",
      description: t.dashboard.dueTodayCount,
      icon: FileText,
    },
    {
      title: t.dashboard.activeCustomers,
      value: "24",
      description: t.dashboard.newThisMonth,
      icon: Users,
    },
    {
      title: t.dashboard.suppliers,
      value: "8",
      description: t.dashboard.activeOnPlatform,
      icon: Truck,
    },
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
