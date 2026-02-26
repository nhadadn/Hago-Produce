"use client";

import { useEffect, useState } from "react";
import { fetchInvoices, InvoiceWithDetails } from "@/lib/api/invoices";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkDownloadButton } from "./BulkDownloadButton";
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
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    // Reset selection when page or filters change
    setSelectedIds([]);
  }, [page, status, startDate, endDate]);

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
        return "bg-hago-primary-100 text-hago-primary-800";
      case "DRAFT":
        return "bg-hago-gray-200 text-hago-gray-700";
      case "OVERDUE":
        return "bg-hago-error/10 text-hago-error";
      case "PENDING":
        return "bg-hago-warning/10 text-hago-warning";
      default:
        return "bg-hago-info/10 text-hago-info";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(invoices.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
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
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium">
            {selectedIds.length} facturas seleccionadas
          </span>
          <BulkDownloadButton
            selectedIds={selectedIds}
            onSuccess={() => setSelectedIds([])}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
          >
            Deseleccionar todo
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    invoices.length > 0 &&
                    selectedIds.length === invoices.length
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todo"
                />
              </TableHead>
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
                <TableCell colSpan={7} className="p-0">
                  <TableSkeleton rows={5} cols={7} />
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(invoice.id)}
                      onCheckedChange={(checked) =>
                        handleSelect(invoice.id, !!checked)
                      }
                      aria-label={`Seleccionar factura ${invoice.number}`}
                    />
                  </TableCell>
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

