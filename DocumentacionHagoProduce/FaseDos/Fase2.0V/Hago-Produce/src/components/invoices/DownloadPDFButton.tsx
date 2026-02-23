'use client';

import { useState, type MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileDown, Loader2 } from 'lucide-react';

interface DownloadPDFButtonProps extends React.ComponentProps<typeof Button> {
  invoiceId: string;
  stopPropagation?: boolean;
}

export function DownloadPDFButton(props: DownloadPDFButtonProps) {
  const { invoiceId, stopPropagation, children, disabled, ...buttonProps } = props;
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

    setLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const response = await fetch(`/api/v1/invoices/${invoiceId}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        let message = 'No se pudo generar el PDF de la factura.';

        try {
          const data = await response.json();
          if (data?.error?.message) {
            message = data.error.message;
          }
        } catch {}

        toast({
          title: 'Error al generar PDF',
          description: message,
          variant: 'destructive',
        });

        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: 'Error al generar PDF',
        description: 'Ocurrió un error inesperado al generar el PDF.',
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

