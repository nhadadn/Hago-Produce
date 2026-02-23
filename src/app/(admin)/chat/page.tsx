'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/lib/hooks/useAuth';
import { Role } from '@prisma/client';

export default function ChatPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <h1 className="text-3xl font-bold tracking-tight">Chat de negocio</h1>
          <p className="text-muted-foreground">Cargando información de usuario...</p>
        </div>
      </div>
    );
  }

  if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING && user.role !== Role.MANAGEMENT) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <h1 className="text-3xl font-bold tracking-tight">Chat de negocio</h1>
          <p className="text-sm text-destructive">No tienes permisos para usar el chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold tracking-tight">Chat de negocio</h1>
        <p className="text-muted-foreground">
          Consulta información de precios, proveedores, facturas y saldos usando lenguaje natural.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}

