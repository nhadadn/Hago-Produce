'use client';

import { useState, type MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileDown, Loader2 } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { InvoiceWithDetails } from '@/lib/api/invoices';

interface DownloadPDFButtonProps extends React.ComponentProps<typeof Button> {
  invoice?: InvoiceWithDetails;
  invoiceId?: string;
  stopPropagation?: boolean;
}

export function DownloadPDFButton(props: DownloadPDFButtonProps) {
  const { invoice, invoiceId, stopPropagation, children, disabled, ...buttonProps } = props;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    if (buttonProps.onClick) {
      buttonProps.onClick(event);
      if (event.defaultPrevented) {
        return;
      }
    }

    if (!invoice && !invoiceId) {
      console.error('No invoice or invoiceId provided');
      return;
    }

    setLoading(true);

    try {
      let invoiceData = invoice;

      if (!invoiceData && invoiceId) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const response = await fetch(`/api/v1/invoices/${invoiceId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error('No se pudo obtener la información de la factura.');
        }

        const json = await response.json();
        if (json.success) {
          invoiceData = json.data;
        } else {
          throw new Error(json.error?.message || 'Error al obtener datos de factura');
        }
      }

      if (!invoiceData) {
        throw new Error('No se encontraron datos para generar el PDF');
      }

      const blob = generateInvoicePDF(invoiceData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceData.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF Generado',
        description: `Factura ${invoiceData.number} descargada correctamente.`,
      });

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error al generar PDF',
        description: error.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileDown className="mr-1 h-4 w-4" />
          {children ?? 'PDF'}
        </>
      )}
    </Button>
  );
}
