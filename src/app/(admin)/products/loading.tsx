import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
