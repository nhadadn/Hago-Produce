'use client';
// ChartWrapper — re-exports recharts components with dynamic loading
// Previously used react-chartjs-2; migrated to recharts to eliminate chart.js dependency (~150-200KB savings)
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const BarChartDynamic = dynamic(
  () => import('recharts').then(m => m.BarChart),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
    ssr: false,
  }
);

export const PieChartDynamic = dynamic(
  () => import('recharts').then(m => m.PieChart),
  {
    loading: () => <Skeleton className="h-48 w-full rounded-full" />,
    ssr: false,
  }
);
