// src/components/portal/BulkDownloadButton.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BulkDownloadButtonProps {
  selectedIds: string[];
  onSuccess?: () => void;
}

export function BulkDownloadButton({ selectedIds, onSuccess }: BulkDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/invoices/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: selectedIds }),
      });
      
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error al generar ZIP');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: '✅ Descarga exitosa', description: `${selectedIds.length} facturas descargadas` });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: '❌ Error', description: err.message || 'No se pudo generar el ZIP', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={selectedIds.length === 0 || loading}
      className="bg-hago-primary-800 hover:bg-hago-primary-900 text-white"
    >
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      Descargar ZIP ({selectedIds.length})
    </Button>
  );
}
