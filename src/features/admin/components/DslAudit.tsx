import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dslService, type DslAuditEntry } from '@/services/dsl.service';
import { Button } from '@/components/Button';

export function DslAudit() {
  const { t } = useTranslation('admin');
  const [entries, setEntries] = useState<DslAuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    dslService
      .getAudit(page * pageSize, pageSize)
      .then((res) => {
        setEntries(res.entries ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setError(t('dsl.audit_error')))
      .finally(() => setLoading(false));
  }, [page, t]);

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
        <h2 className="text-lg font-bold text-navy">{t('dsl.audit_title')}</h2>
        <p className="mt-1 text-sm text-gray">{t('dsl.audit_subtitle')}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray">{t('dsl.loading')}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray">{t('dsl.audit_empty')}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-gray/20">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray/20 bg-gray-50">
                  <th className="w-10 px-3 py-2 font-medium text-navy"></th>
                  <th className="px-3 py-2 font-medium text-navy">{t('dsl.col')}</th>
                  <th className="px-3 py-2 font-medium text-navy">{t('dsl.query_label')}</th>
                  <th className="px-3 py-2 font-medium text-navy">{t('dsl.status')}</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-navy">{t('dsl.by')}</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-navy">{t('dsl.date')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isOpen = expanded.has(entry.id);
                  return (
                    <>
                      <tr
                        key={entry.id}
                        onClick={() => toggleExpand(entry.id)}
                        className="cursor-pointer border-b border-gray/10 hover:bg-gray-50/50"
                      >
                        <td className="px-3 py-2 text-center text-gray">
                          {isOpen ? '▾' : '▸'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <code className="font-mono text-xs text-navy">{entry.collection}</code>
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
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray">
                          {entry.userRole}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray">
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
                      {/* Ligne détail expandée */}
                      {isOpen && (
                        <tr key={`${entry.id}-detail`} className="border-b border-gray/10 bg-gray-50/30">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="flex flex-col gap-2 text-xs">
                              <DetailRow label="DSL" value={entry.query} mono />
                              <DetailRow
                                label="Filtre MongoDB"
                                value={entry.filter ? JSON.stringify(entry.filter, null, 2) : '—'}
                                mono
                              />
                              <DetailRow
                                label="Limite"
                                value={String(entry.limit)}
                              />
                              <DetailRow
                                label="Résultats"
                                value={entry.resultCount != null ? String(entry.resultCount) : '—'}
                              />
                              {entry.errorMessage && (
                                <DetailRow label="Error" value={entry.errorMessage} error />
                              )}
                              <div className="flex gap-6 text-gray">
                                <span>user: <code className="text-navy">{entry.userId}</code></span>
                                <span>rôle: <code className="text-navy">{entry.userRole}</code></span>
                                <span>IP: <code className="text-navy">{entry.ipAddress}</code></span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-gray">
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
      <span className="font-medium text-gray">{label}:</span>{' '}
      <span className={error ? 'text-red-600' : 'text-navy'}>
        {mono ? (
          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-gray-100 p-2 font-mono text-navy">{value}</pre>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
