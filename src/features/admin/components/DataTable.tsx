import { useState, useMemo } from 'react';
import { redactDocument } from '../utils/redact';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: DataTableColumn[];
  data: Record<string, unknown>[];
  rowKey?: (row: Record<string, unknown>, i: number) => string;
  onRowClick?: (row: Record<string, unknown>, i: number) => void;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable({
  columns,
  data,
  rowKey,
  onRowClick,
  pageSize = 20,
  loading = false,
  emptyMessage = 'No data.',
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey] as string | number | undefined;
      const vb = b[sortKey] as string | number | undefined;
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(col: DataTableColumn) {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir('asc');
    } else {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
    }
    setPage(0);
  }

  function sortIcon(key: string): string {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '↑' : sortDir === 'desc' ? '↓' : '↕';
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-auto rounded-lg border border-gray/200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray/200 bg-gray-50">
              <td className="w-10 px-4 py-2 text-center text-gray">#</td>
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2 font-medium text-navy">
                  {c.label}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="animate-pulse border-b border-gray/50">
                <td className="px-4 py-3 text-center text-gray">{i}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    <div className="h-3 w-24 rounded bg-gray-100" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <div className="rounded-lg border border-gray/200 bg-white px-5 py-8 text-center text-sm text-gray">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-lg border border-gray/200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray/200 bg-gray-50">
              <td className="w-10 select-none px-4 py-2 text-center text-gray">#</td>
              {columns.map((c) => (
                <td
                  key={c.key}
                  onClick={() => handleSort(c)}
                  className={`px-4 py-2 font-medium text-navy ${
                    c.sortable ? 'cursor-pointer select-none hover:text-orange' : ''
                  }`}
                >
                  {c.label} {c.sortable ? sortIcon(c.key) : ''}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                onClick={() => onRowClick?.(row, i)}
                className={`border-b border-gray/50 ${
                  onRowClick ? 'cursor-pointer hover:bg-orange/5' : ''
                } ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
              >
                <td className="w-10 select-none px-4 py-2.5 text-center text-gray">
                  {page * pageSize + i + 1}
                </td>
                {columns.map((c) => {
                  const val = redactCell(row[c.key]);
                  return (
                    <td key={c.key} className="max-w-xs truncate px-4 py-2.5 font-mono text-navy">
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} sur {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-gray/20 px-2 py-1 disabled:opacity-30"
            >
              ←
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray/20 px-2 py-1 disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Redact a single cell value for display. */
function redactCell(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') {
    // Redact binary placeholders
    if (val.startsWith('[BINARY:') || val.startsWith('[ENCRYPTED]') || val.endsWith('***')) {
      return val;
    }
    // Truncate long strings
    return val.length > 200 ? val.slice(0, 200) + '…' : val;
  }
  if (typeof val === 'object') {
    // Apply redactDocument for nested objects
    const redacted = redactDocument(val as Record<string, unknown>);
    const s = JSON.stringify(redacted);
    return s.length > 300 ? s.slice(0, 300) + '…' : s;
  }
  return String(val);
}
