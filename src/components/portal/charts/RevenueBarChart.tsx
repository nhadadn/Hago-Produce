'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import to avoid SSR issues with recharts (uses browser DOM APIs)
const RevenueBarChartInner = dynamic(
  () => import('./RevenueBarChartInner').then(m => m.RevenueBarChartInner),
  {
    loading: () => <Skeleton className="h-full w-full rounded-lg" />,
    ssr: false,
  }
);

interface RevenueBarChartProps {
  data: { month: string; revenue: number }[];
}

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  return <RevenueBarChartInner data={data} />;
}
