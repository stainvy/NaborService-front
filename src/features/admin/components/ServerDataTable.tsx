import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ServerDataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface ServerDataTableProps<T> {
  columns: ServerDataTableColumn<T>[];
  data: T[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
}

export function ServerDataTable<T>({
  columns,
  data,
  total,
  offset,
  limit,
  onPageChange,
  onRowClick,
  rowKey,
  loading = false,
  emptyMessage = 'Aucune donnée.',
}: ServerDataTableProps<T>) {
  const page = Math.floor(offset / limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return (
      <div className="overflow-auto rounded-lg border border-admin-border bg-admin-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-admin-border bg-admin-bg">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2.5 font-medium text-admin-text">
                  {c.label}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="animate-pulse border-b border-admin-border">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    <div className="h-3 w-24 rounded bg-admin-bg" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border border-admin-border bg-admin-surface px-5 py-8 text-center text-sm text-admin-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-lg border border-admin-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-admin-border bg-admin-bg">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2.5 font-medium text-admin-text">
                  {c.label}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-admin-border bg-admin-surface last:border-0 ${
                  onRowClick ? 'cursor-pointer hover:bg-admin-bg' : ''
                } ${i % 2 === 1 ? 'bg-admin-bg/40' : ''}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-admin-text">
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-admin-muted">
          <span>
            {offset + 1}–{Math.min(offset + limit, total)} sur {total}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              className="rounded border border-admin-border px-2 py-1 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="flex items-center px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(offset + limit)}
              className="rounded border border-admin-border px-2 py-1 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
