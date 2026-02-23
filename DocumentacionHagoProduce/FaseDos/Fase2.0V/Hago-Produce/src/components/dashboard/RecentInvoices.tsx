import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recentInvoices = [
  {
    invoice: "INV001",
    status: "Pagado",
    total: "$250.00",
    method: "Transferencia",
    customer: "Fresh Market",
  },
  {
    invoice: "INV002",
    status: "Pendiente",
    total: "$150.00",
    method: "Tarjeta",
    customer: "Super Valu",
  },
  {
    invoice: "INV003",
    status: "Pagado",
    total: "$350.00",
    method: "Transferencia",
    customer: "Organic Foods",
  },
  {
    invoice: "INV004",
    status: "Vencido",
    total: "$450.00",
    method: "Cheque",
    customer: "Green Grocer",
  },
  {
    invoice: "INV005",
    status: "Pagado",
    total: "$550.00",
    method: "Transferencia",
    customer: "Whole Foods",
  },
];

export function RecentInvoices() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Facturas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Factura</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentInvoices.map((invoice) => (
              <TableRow key={invoice.invoice}>
                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell className="text-right">{invoice.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
