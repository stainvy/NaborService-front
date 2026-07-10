import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { useDslQuery } from '../hooks/useDslTools';
import { COLLECTIONS, type LifecycleFilter } from '../schemas/fieldRegistry';
import { redactDocument, MiniBlock } from '../utils/redact';

function defaultQuery(collectionId: string): string {
  return `GET ${collectionId}
LIMIT 10`;
}

export function DslConsole() {
  const { t } = useTranslation('admin');
  const [collection, setCollection] = useState(COLLECTIONS[0]);
  const [query, setQuery] = useState(() => defaultQuery(collection.id));
  const dslQuery = useDslQuery();

  function handleCollectionChange(id: string) {
    const col = COLLECTIONS.find((c) => c.id === id) ?? COLLECTIONS[0];
    setCollection(col);
    setQuery(defaultQuery(col.id));
    dslQuery.reset();
  }

  function applyFilter(f: LifecycleFilter) {
    const val = f.value ? ` ${f.operator} "${f.value}"` : '';
    // Insère une clause WHERE ou l'ajoute après une clause existante
    if (query.includes('WHERE')) {
      setQuery(query.replace(/WHERE (.+)/, `WHERE $1 AND ${f.field} ${f.operator}${val}`));
    } else if (query.includes('LIMIT')) {
      setQuery(query.replace('LIMIT', `WHERE ${f.field} ${f.operator}${val}\nLIMIT`));
    } else {
      setQuery(query + `\nWHERE ${f.field} ${f.operator}${val}`);
    }
  }

  function handleExecute() {
    if (!query.trim()) return;
    dslQuery.mutate({ query: query.trim(), collection: collection.id });
  }

  const result = dslQuery.data;
  const error = dslQuery.isError
    ? ((dslQuery.error as any)?.response?.data?.message ?? (dslQuery.error as any)?.message ?? t('dsl.unknown_error'))
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('dsl.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('dsl.subtitle')}</p>
      </div>

      {/* Sélecteur de collection */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-admin-text">{t('dsl.collection')}:</span>
        {COLLECTIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCollectionChange(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              collection.id === c.id
                ? 'bg-admin-accent text-white'
                : 'bg-admin-bg text-admin-muted hover:bg-admin-border'
            }`}
          >
            {c.id}
          </button>
        ))}
      </div>

      {/* Filtres cycle de vie */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-admin-muted">{t('dsl.lifecycle_filters')}:</span>
        {collection.lifecycleFilters.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => applyFilter(f)}
            className="rounded-full border border-admin-border bg-admin-bg px-2.5 py-1 font-mono text-[11px] text-admin-text transition-colors hover:border-admin-accent hover:bg-admin-accent/5"
            title={`${f.field} ${f.operator} ${f.value ?? ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Éditeur de requête */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-admin-text">{t('dsl.query_label')}</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          spellCheck={false}
          className="rounded-md border border-admin-border bg-admin-bg px-4 py-3 font-mono text-sm leading-relaxed text-admin-text outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent"
          placeholder="GET contracts&#10;WHERE signed_at IS NOT NULL&#10;LIMIT 20"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-admin-muted">{t('dsl.editor_hint')}</p>
          <Button tone="admin" onClick={handleExecute} disabled={dslQuery.isPending || !query.trim()}>
            {dslQuery.isPending ? t('dsl.executing') : t('dsl.execute')}
          </Button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{t('dsl.error_title')}</p>
          <pre className="mt-1 whitespace-pre-wrap text-sm text-red-600">{error}</pre>
        </div>
      )}

      {/* Résultats */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* ── Section Documents ── */}
          <div className="rounded-lg border border-admin-border bg-admin-surface">
            <div className="flex items-center justify-between border-b border-admin-border px-5 py-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-admin-text">{t('dsl.results_title')}</h3>
                <code className="rounded bg-admin-bg px-2 py-0.5 font-mono text-xs text-admin-muted">
                  {result.collection}
                </code>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {result.resultCount} {t('dsl.results_count')}
                </span>
              </div>
            </div>

            {result.results.length > 0 ? (
              <div className="max-h-[32rem] overflow-auto">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {result.results.map((doc, i) => (
                      <tr
                        key={i}
                        className={`border-b border-admin-border/60 hover:bg-admin-bg/50 ${
                          i % 2 === 0 ? '' : 'bg-admin-bg/30'
                        }`}
                      >
                        <td className="w-10 select-none px-4 py-2.5 text-center text-admin-muted">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5 font-mono leading-relaxed text-admin-text">
                          <pre className="max-h-20 overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(redactDocument(doc), null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-admin-muted">
                {t('dsl.no_results')}
              </div>
            )}
          </div>

          {/* ── Section Filtre généré ── */}
          <details className="rounded-lg border border-admin-border bg-admin-surface">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-medium text-admin-text">
              <span>{t('dsl.generated_filter')}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(JSON.stringify(result.filter, null, 2));
                }}
                className="rounded border border-admin-border px-2 py-1 text-xs text-admin-muted hover:bg-admin-bg"
              >
                {t('dsl.copy_filter')}
              </button>
            </summary>
            <div className="grid grid-cols-1 gap-4 border-t border-admin-border px-5 py-4 lg:grid-cols-3">
              <MiniBlock label={t('dsl.filter')} json={result.filter} />
              <MiniBlock label={t('dsl.projection')} json={result.projection} />
              <div className="flex flex-col gap-2">
                <MiniBlock label={t('dsl.order')} json={result.order} />
                <MiniBlock label={t('dsl.limit_label')} value={result.limit} />
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
