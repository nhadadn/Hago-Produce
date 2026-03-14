'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchInvoice, InvoiceWithDetails } from '@/lib/api/invoices';
import InvoiceForm from '@/components/invoices/CreateInvoiceForm';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/i18n';

interface EditInvoicePageProps {
  params: {
    id: string;
  };
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
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
          description: error.message || t.invoices.changeStatus.invoiceNotFound,
        });
        router.push('/invoices');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [params.id, router, toast, t.invoices.changeStatus.invoiceNotFound]);

  if (loading) {
    return <div className="p-8 text-center">{t.common.loadingInvoice}</div>;
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t.invoices.editTitle}</h3>
        <p className="text-sm text-muted-foreground">
          {t.invoices.changeStatus.modalDescription} {invoice.number}.
        </p>
      </div>
      <InvoiceForm initialData={invoice} isEditing={true} />
    </div>
  );
}
