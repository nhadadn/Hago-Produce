'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchInvoice, InvoiceWithDetails } from '@/lib/api/invoices';
import InvoiceForm from '@/components/invoices/CreateInvoiceForm';
import { useToast } from '@/components/ui/use-toast';

interface EditInvoicePageProps {
  params: {
    id: string;
  };
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const data = await fetchInvoice(params.id);
        setInvoice(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'No se pudo cargar la factura.',
        });
        router.push('/invoices');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [params.id, router, toast]);

  if (loading) {
    return <div className="p-8 text-center">Cargando factura...</div>;
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Editar Factura</h3>
        <p className="text-sm text-muted-foreground">
          Modifique los detalles de la factura {invoice.number}.
        </p>
      </div>
      <InvoiceForm initialData={invoice} isEditing={true} />
    </div>
  );
}
