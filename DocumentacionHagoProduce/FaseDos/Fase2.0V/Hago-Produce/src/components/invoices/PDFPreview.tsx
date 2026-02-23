'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface PDFPreviewProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PDFPreview({ invoiceId, open, onOpenChange }: PDFPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    let currentUrl: string | null = null;

    const loadPdf = async () => {
      if (!open) {
        setBlobUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return null;
        });
        return;
      }

      setLoading(true);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        const response = await fetch(`/api/v1/invoices/${invoiceId}/pdf`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        if (!response.ok) {
          let message = 'No se pudo generar el PDF de la factura.';

          try {
            const data = await response.json();
            if (data?.error?.message) {
              message = data.error.message;
            }
          } catch {}

          if (!cancelled) {
            toast({
              title: 'Error al generar PDF',
              description: message,
              variant: 'destructive',
            });
          }

          return;
        }

        const blob = await response.blob();
        currentUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setBlobUrl(currentUrl);
        } else if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
      } catch {
        if (!cancelled) {
          toast({
            title: 'Error al generar PDF',
            description: 'Ocurrió un error inesperado al generar el PDF.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      setBlobUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [invoiceId, open, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vista previa de factura</DialogTitle>
          <DialogDescription>
            Visualiza el PDF antes de descargarlo.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando PDF...
          </div>
        ) : blobUrl ? (
          <div className="h-[70vh]">
            <iframe src={blobUrl} className="h-full w-full rounded-md border" />
          </div>
        ) : (
          <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">
            No se pudo cargar la vista previa.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

