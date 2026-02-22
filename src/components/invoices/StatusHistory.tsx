'use client';

import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface StatusHistoryEntry {
  id: string;
  date: string;
  status: string;
  description?: string;
}

interface StatusHistoryProps {
  entries: StatusHistoryEntry[];
}

export function StatusHistory({ entries }: StatusHistoryProps) {
  if (!entries.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Sin historial de estado disponible.
      </div>
    );
  }

  return (
    <ol className="relative border-l border-border space-y-4 pl-4">
      {entries.map((entry, index) => (
        <li key={entry.id} className="ml-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full border-2 border-background bg-primary',
                index !== 0 && 'bg-background',
              )}
            />
            <span className="text-xs text-muted-foreground">
              {formatDate(entry.date)}
            </span>
          </div>
          <div className="mt-1 ml-4">
            <div className="text-sm font-medium">{entry.status}</div>
            {entry.description && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {entry.description}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

