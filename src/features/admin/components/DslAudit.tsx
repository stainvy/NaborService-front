import { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { useDslAudit } from '../hooks/useDslTools';

export function DslAudit() {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const pageSize = 20;

  const { data, isLoading, isError } = useDslAudit(page * pageSize, pageSize);
  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('dsl.audit_title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('dsl.audit_subtitle')}</p>
      </div>

      {isError && <p className="text-sm text-red-600">{t('dsl.audit_error')}</p>}

      {isLoading ? (
        <p className="text-sm text-admin-muted">{t('dsl.loading')}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-admin-muted">{t('dsl.audit_empty')}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-admin-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-admin-bg">
                  <th className="w-10 px-3 py-2 font-medium text-admin-text"></th>
                  <th className="px-3 py-2 font-medium text-admin-text">{t('dsl.col')}</th>
                  <th className="px-3 py-2 font-medium text-admin-text">{t('dsl.query_label')}</th>
                  <th className="px-3 py-2 font-medium text-admin-text">{t('dsl.status')}</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-admin-text">{t('dsl.by')}</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-admin-text">{t('dsl.date')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isOpen = expanded.has(entry.id);
                  return (
                    <Fragment key={entry.id}>
                      <tr
                        onClick={() => toggleExpand(entry.id)}
                        className="cursor-pointer border-b border-admin-border/60 hover:bg-admin-bg/50"
                      >
                        <td className="px-3 py-2 text-center text-admin-muted">
                          {isOpen ? '▾' : '▸'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <code className="font-mono text-xs text-admin-text">{entry.collection}</code>
                        </td>
                        <td className="max-w-xs truncate px-3 py-2 font-mono text-xs" title={entry.query}>
                          {entry.query.replace(/\n/g, ' · ')}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              entry.success
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {entry.success ? 'OK' : 'ERR'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-admin-muted">
                          {entry.userRole}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-admin-muted">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleString(undefined, {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-admin-border/60 bg-admin-bg/30">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="flex flex-col gap-2 text-xs">
                              <DetailRow label="DSL" value={entry.query} mono />
                              <DetailRow
                                label="Filtre MongoDB"
                                value={entry.filter ? JSON.stringify(entry.filter, null, 2) : '—'}
                                mono
                              />
                              <DetailRow label="Limite" value={String(entry.limit)} />
                              <DetailRow
                                label="Résultats"
                                value={entry.resultCount != null ? String(entry.resultCount) : '—'}
                              />
                              {entry.errorMessage && (
                                <DetailRow label="Error" value={entry.errorMessage} error />
                              )}
                              <div className="flex gap-6 text-admin-muted">
                                <span>user: <code className="text-admin-text">{entry.userId}</code></span>
                                <span>rôle: <code className="text-admin-text">{entry.userRole}</code></span>
                                <span>IP: <code className="text-admin-text">{entry.ipAddress}</code></span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-admin-muted">
            <span>
              {t('dsl.showing', {
                from: page * pageSize + 1,
                to: Math.min((page + 1) * pageSize, total),
                total,
              })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                tone="admin"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs"
              >
                ← {t('dsl.previous')}
              </Button>
              <span className="flex items-center px-2 text-xs">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                tone="admin"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs"
              >
                {t('dsl.next')} →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, error }: { label: string; value: string; mono?: boolean; error?: boolean }) {
  return (
    <div>
      <span className="font-medium text-admin-muted">{label}:</span>{' '}
      <span className={error ? 'text-red-600' : 'text-admin-text'}>
        {mono ? (
          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-admin-bg p-2 font-mono text-admin-text">{value}</pre>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
