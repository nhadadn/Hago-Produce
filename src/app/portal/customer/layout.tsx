'use client';

import { ReactNode } from 'react';
import { CustomerProtected } from '@/components/portal/CustomerProtected';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerProtected>
      <ErrorBoundary>{children}</ErrorBoundary>
    </CustomerProtected>
  );
}

