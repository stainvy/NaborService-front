import type { ComponentType } from 'react';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

interface StatTileProps {
  label: string;
  value: number | string;
  icon?: ComponentType<{ className?: string }>;
  loading?: boolean;
}

// Tuile de statistique (libellé + valeur), en tokens de marque.
export function StatTile({ label, value, icon: Icon, loading = false }: StatTileProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-fg">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="mb-1 h-6 w-10" />
        ) : (
          <p className="text-2xl font-bold leading-tight text-fg">{value}</p>
        )}
        <p className="truncate text-xs font-medium uppercase tracking-wide text-brand-muted">
          {label}
        </p>
      </div>
    </Card>
  );
}
