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
import { Plus } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { InvoiceStatus, Role } from "@prisma/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { fetchCustomers } from "@/lib/api/customers";
import type { Customer } from "@prisma/client";
import { DownloadPDFButton } from "@/components/invoices/DownloadPDFButton";
import { clientLogger as logger } from "@/lib/logger/client-logger";
import { useLanguage } from "@/lib/i18n";

export default function InvoiceList() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

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

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetchCustomers({ limit: 100, isActive: true });
        setCustomers(res.data.customers);
      } catch (error) {
        logger.error("Failed to load customers:", error);
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
          logger.error("Failed to load invoices:", error);
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
  }, [page, status, customerId, startDate, endDate, search]);

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
        {user?.role !== Role.CUSTOMER && (
          <Button onClick={() => router.push("/invoices/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t.invoices.newInvoice}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.invoices.number}</TableHead>
              <TableHead>{t.invoices.customer}</TableHead>
              <TableHead>{t.invoices.issueDate}</TableHead>
              <TableHead>{t.invoices.dueDate}</TableHead>
              <TableHead>{t.invoices.total}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead className="text-right">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t.invoices.loadingInvoices}
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t.invoices.noInvoices}
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
                  )}
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.customer.name}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(Number(invoice.total))}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)} variant="secondary">
                      {t.invoices.statusLabels[invoice.status as keyof typeof t.invoices.statusLabels] || invoice.status}
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
                      {t.invoices.view}
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
                          {t.invoices.edit}
                        </Button>
                      )}
                    <DownloadPDFButton
                      invoiceId={invoice.id}
                      variant="ghost"
                      size="sm"
                      stopPropagation
                    >
                      {t.invoices.pdf}
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
          {t.common.previous}
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          {t.common.page} {page} {t.common.of} {totalPages || 1}
        </div>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          {t.common.next}
        </Button>
      </div>
    </div>
  );
}
