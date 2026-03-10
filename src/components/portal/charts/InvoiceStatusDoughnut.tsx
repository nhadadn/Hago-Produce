'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import to avoid SSR issues with recharts (uses browser DOM APIs)
const InvoiceStatusDoughnutInner = dynamic(
  () => import('./InvoiceStatusDoughnutInner').then(m => m.InvoiceStatusDoughnutInner),
  {
    loading: () => <Skeleton className="h-48 w-48 rounded-full" />,
    ssr: false,
  }
);

interface InvoiceStatusDoughnutProps {
  data: { status: string; count: number }[];
}

export function InvoiceStatusDoughnut({ data }: InvoiceStatusDoughnutProps) {
  return <InvoiceStatusDoughnutInner data={data} />;
}
