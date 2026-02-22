'use client';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ChangeStatusModal } from '@/components/invoices/ChangeStatusModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Role } from '@prisma/client';

interface ChangeStatusPageProps {
  params: {
    id: string;
  };
}

export default function ChangeStatusPage({ params }: ChangeStatusPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <h1 className="text-3xl font-bold tracking-tight">Cambiar estado</h1>
          <p className="text-muted-foreground">Cargando información de usuario...</p>
        </div>
      </div>
    );
  }

  if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <h1 className="text-3xl font-bold tracking-tight">Cambiar estado</h1>
          <p className="text-sm text-destructive">
            No tienes permisos para cambiar el estado de facturas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Cambiar estado de factura</h1>
        <p className="text-muted-foreground">
          Selecciona el nuevo estado y confirma el cambio.
        </p>
      </div>
      <ChangeStatusModal
        invoiceId={params.id}
        open
        onClose={() => router.push(`/invoices/${params.id}`)}
      />
    </div>
  );
}

