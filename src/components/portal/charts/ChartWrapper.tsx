'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import para no bloquear LCP y optimizar bundle inicial
export const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), {
  loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
  ssr: false,
});

export const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), {
  loading: () => <Skeleton className="h-48 w-full rounded-full" />,
  ssr: false,
});
