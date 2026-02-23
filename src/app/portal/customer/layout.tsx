'use client';

import { ReactNode } from 'react';
import { CustomerProtected } from '@/components/portal/CustomerProtected';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <CustomerProtected>{children}</CustomerProtected>;
}

