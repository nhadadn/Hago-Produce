'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

const recentInvoicesData = [
  {
    invoice: "INV001",
    statusKey: "PAID" as const,
    total: "$250.00",
    customer: "Fresh Market",
  },
  {
    invoice: "INV002",
    statusKey: "PENDING" as const,
    total: "$150.00",
    customer: "Super Valu",
  },
  {
    invoice: "INV003",
    statusKey: "PAID" as const,
    total: "$350.00",
    customer: "Organic Foods",
  },
  {
    invoice: "INV004",
    statusKey: "OVERDUE" as const,
    total: "$450.00",
    customer: "Green Grocer",
  },
  {
    invoice: "INV005",
    statusKey: "PAID" as const,
    total: "$550.00",
    customer: "Whole Foods",
  },
];

const getStatusVariant = (statusKey: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (statusKey) {
    case "PAID":
      return "default";
    case "PENDING":
      return "secondary";
    case "OVERDUE":
      return "destructive";
    default:
      return "outline";
  }
};

export function RecentInvoices() {
  const { t } = useLanguage();

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>{t.dashboard.recentInvoices}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t.dashboard.invoice}</TableHead>
              <TableHead>{t.dashboard.status}</TableHead>
              <TableHead>{t.dashboard.customer}</TableHead>
              <TableHead className="text-right">{t.dashboard.amount}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentInvoicesData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {t.dashboard.noRecentInvoices}
                </TableCell>
              </TableRow>
            ) : (
              recentInvoicesData.map((invoice) => (
                <TableRow key={invoice.invoice}>
                  <TableCell className="font-medium">{invoice.invoice}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.statusKey)}>
                      {t.invoices.statusLabels[invoice.statusKey as keyof typeof t.invoices.statusLabels] || invoice.statusKey}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-right">{invoice.total}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
