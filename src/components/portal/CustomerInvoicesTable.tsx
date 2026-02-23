"use client";

import { useEffect, useState } from "react";
import { fetchInvoices, InvoiceWithDetails } from "@/lib/api/invoices";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";
import { CustomerInvoiceFilters } from "./CustomerInvoiceFilters";
import { CustomerDownloadPDFButton } from "./CustomerDownloadPDFButton";
import { CustomerInvoiceDetailDialog } from "./CustomerInvoiceDetailDialog";

export function CustomerInvoicesTable() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadInvoices() {
      setLoading(true);
      try {
        const res = await fetchInvoices({
          page,
          limit: 10,
          status: status === "ALL" ? undefined : status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        if (cancelled) return;
        setInvoices(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInvoices();
    return () => {
      cancelled = true;
    };
  }, [page, status, startDate, endDate]);

  const getStatusColor = (invoiceStatus: string) => {
    switch (invoiceStatus) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-4">
      <CustomerInvoiceFilters
        status={status}
        startDate={startDate}
        endDate={endDate}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        onStartDateChange={(v) => {
          setStartDate(v);
          setPage(1);
        }}
        onEndDateChange={(v) => {
          setEndDate(v);
          setPage(1);
        }}
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Emisión</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando facturas...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron facturas.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    invoice.status === InvoiceStatus.OVERDUE && "bg-red-50/60"
                  )}
                  onClick={() => {
                    setSelectedInvoiceId(invoice.id);
                    setDetailOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(Number(invoice.total))}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)} variant="secondary">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CustomerDownloadPDFButton
                      invoiceId={invoice.id}
                      variant="ghost"
                      size="sm"
                      stopPropagation
                    >
                      PDF
                    </CustomerDownloadPDFButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">Página {page} de {totalPages || 1}</div>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </Button>
      </div>

      <CustomerInvoiceDetailDialog
        invoiceId={selectedInvoiceId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedInvoiceId(null);
        }}
      />
    </div>
  );
}

