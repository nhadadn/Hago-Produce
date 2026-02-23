'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/hooks/useCustomerAuth';

interface Props {
  children: ReactNode;
}

export function CustomerProtected({ children }: Props) {
  const { customer, isLoading } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push('/portal/login');
    }
  }, [customer, isLoading, router]);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!customer) {
    return null;
  }

  return <>{children}</>;
}

