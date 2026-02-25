"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Loader2, Download } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { InvoiceStatus, Role } from "@prisma/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { fetchCustomers } from "@/lib/api/customers";
import type { Customer } from "@prisma/client";
import { DownloadPDFButton } from "@/components/invoices/DownloadPDFButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import JSZip from 'jszip';
import { generateInvoicePDF } from '@/lib/pdf-generator';

export default function InvoiceList() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [customerId, setCustomerId] = useState<string | "ALL">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetchCustomers({ limit: 100, isActive: true });
        setCustomers(res.data.data);
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    }
    loadCustomers();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      setLoading(true);
      setSelectedIds(new Set()); // Reset selection on reload
      try {
        const res = await fetchInvoices({
          page,
          limit: 10,
          search: search || undefined,
          status: status === "ALL" ? undefined : status,
          customerId: customerId === "ALL" ? undefined : customerId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        if (cancelled) return;
        setInvoices(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load invoices:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las facturas.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInvoices();

    return () => {
      cancelled = true;
    };
  }, [page, status, customerId, startDate, endDate, search, toast]);

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

  const handleStatusChange = (value: InvoiceStatus | "ALL") => {
    setStatus(value);
    setPage(1);
  };

  const handleCustomerChange = (value: string | "ALL") => {
    setCustomerId(value);
    setPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(invoices.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const selectedInvoices = invoices.filter(inv => selectedIds.has(inv.id));
      
      let count = 0;
      for (const inv of selectedInvoices) {
        const pdfBlob = generateInvoicePDF(inv);
        zip.file(`factura-${inv.number}.pdf`, pdfBlob);
        count++;
      }

      if (count === 0) {
        throw new Error("No se encontraron facturas seleccionadas en la página actual.");
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facturas-export-${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Exportación completada",
        description: `Se han exportado ${count} facturas en ZIP.`,
      });
      setSelectedIds(new Set()); // Clear selection
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el archivo ZIP.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <InvoiceFilters
          searchInput={searchInput}
          status={status}
          customerId={customerId}
          startDate={startDate}
          endDate={endDate}
          customers={customers}
          onSearchInputChange={setSearchInput}
          onStatusChange={handleStatusChange}
          onCustomerChange={handleCustomerChange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="outline" onClick={handleBulkDownload} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Descargar ZIP ({selectedIds.size})
            </Button>
          )}
          {user?.role !== Role.CUSTOMER && (
            <Button onClick={() => router.push("/invoices/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={invoices.length > 0 && selectedIds.size === invoices.length}
                  onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                  aria-label="Seleccionar todas"
                />
              </TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[80px]" /></TableCell>
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No se encontraron facturas.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    invoice.status === InvoiceStatus.OVERDUE &&
                      "bg-red-50/60",
                    selectedIds.has(invoice.id) && "bg-muted"
                  )}
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.has(invoice.id)}
                      onCheckedChange={(checked) => toggleSelect(invoice.id, checked as boolean)}
                      aria-label={`Seleccionar factura ${invoice.number}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.customer.name}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(Number(invoice.total))}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)} variant="secondary">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/invoices/${invoice.id}`);
                      }}
                    >
                      Ver
                    </Button>
                    {user?.role !== Role.CUSTOMER &&
                      invoice.status === InvoiceStatus.DRAFT && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoices/${invoice.id}/edit`);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                    <DownloadPDFButton
                      invoiceId={invoice.id}
                      variant="ghost"
                      size="sm"
                      stopPropagation
                    >
                      PDF
                    </DownloadPDFButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          Anterior
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          Página {page} de {totalPages || 1}
        </div>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
