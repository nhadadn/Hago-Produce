'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

export type ReportType = 'revenue' | 'aging' | 'top-customers' | 'top-products' | 'price-trends';

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  asOfDate?: string;
  productId?: string;
  months?: number;
}

interface ExportButtonProps {
  reportType: ReportType;
  filters: ExportFilters;
  disabled?: boolean;
}

export function ExportButton({ reportType, filters, disabled }: ExportButtonProps) {
  const [loading, setLoading] = useState<'pdf' | 'csv' | null>(null);

  const handleExport = async (format: 'pdf' | 'csv') => {
    setLoading(format);
    try {
      const body = { reportType, filters };
      const endpoint = `/api/v1/reports/export/${format}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        const message = json.error?.message || 'Error al exportar';
        alert(message);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${reportType}-report.${format}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al exportar');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || !!loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={!!loading}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={!!loading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}