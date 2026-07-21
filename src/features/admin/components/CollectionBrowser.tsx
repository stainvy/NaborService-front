import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dslService, type DslQueryResult } from '@/services/dsl.service';
import { Button } from '@/components/Button';
import { COLLECTIONS, type LifecycleFilter } from '../schemas/fieldRegistry';
import { DataTable, type DataTableColumn } from './DataTable';
import { MiniBlock } from '../utils/redact';

function defaultQuery(collectionId: string): string {
  const col = COLLECTIONS.find((c) => c.id === collectionId);
  return col?.prebuiltQuery ?? `GET ${collectionId}\nLIMIT 20`;
}

export function CollectionBrowser() {
  const { t } = useTranslation('admin');
  const [collection, setCollection] = useState(COLLECTIONS[0]);
  const [query, setQuery] = useState(() => defaultQuery(collection.id));
  const [result, setResult] = useState<DslQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleCollectionChange(id: string) {
    const col = COLLECTIONS.find((c) => c.id === id) ?? COLLECTIONS[0];
    setCollection(col);
    setQuery(defaultQuery(col.id));
    setResult(null);
    setError(null);
  }

  function applyFilter(f: LifecycleFilter) {
    const val = f.value ? ` ${f.operator} "${f.value}"` : '';
    if (query.includes('WHERE')) {
      setQuery(query.replace(/WHERE (.+)/, `WHERE $1 AND ${f.field} ${f.operator}${val}`));
    } else if (query.includes('LIMIT')) {
      setQuery(query.replace('LIMIT', `WHERE ${f.field} ${f.operator}${val}\nLIMIT`));
    } else {
      setQuery(query + `\nWHERE ${f.field} ${f.operator}${val}`);
    }
  }

  async function handleExecute() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await dslService.executeQuery({ query: query.trim(), collection: collection.id });
      setResult(res);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? t('dsl.unknown_error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Build columns from result documents
  const columns: DataTableColumn[] = buildColumns(result);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-fg">{t('browser.title')}</h2>
        <p className="mt-1 text-sm text-gray">{t('browser.subtitle')}</p>
      </div>

      {/* Sélecteur de collection */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-fg">{t('dsl.collection')}:</span>
        {COLLECTIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCollectionChange(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              collection.id === c.id
                ? 'bg-orange text-white'
                : 'bg-gray/10 text-gray hover:bg-gray/20'
            }`}
          >
            {c.id}
          </button>
        ))}
      </div>

      {/* Filtres cycle de vie */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray">{t('dsl.lifecycle_filters')}:</span>
        {collection.lifecycleFilters.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => applyFilter(f)}
            className="rounded-full border border-gray/20 bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-fg transition-colors hover:border-orange hover:bg-orange/5"
            title={`${f.field} ${f.operator} ${f.value ?? ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Éditeur de requête */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-fg">{t('dsl.query_label')}</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          spellCheck={false}
          className="rounded-md border border-gray/30 bg-surface-2 px-4 py-3 font-mono text-sm leading-relaxed text-fg outline-none focus:border-orange focus:ring-1 focus:ring-orange"
          placeholder="GET contracts\nWHERE signed_at IS NOT NULL\nLIMIT 20"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray">{t('dsl.editor_hint')}</p>
          <Button onClick={handleExecute} disabled={loading || !query.trim()}>
            {loading ? t('browser.running') : t('browser.run_query')}
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
          <div className="rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-gray/100 px-5 py-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-fg">{t('browser.results')}</h3>
                <code className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-gray">
                  {result.collection}
                </code>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {result.resultCount} {t('dsl.results_count')}
                </span>
              </div>
            </div>

            <div className="p-4">
              <DataTable
                columns={columns}
                data={result.results}
                pageSize={20}
                loading={false}
                emptyMessage={t('browser.no_results')}
              />
            </div>
          </div>

          {/* ── Section Filtre généré ── */}
          <details className="rounded-lg border border-border bg-surface">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-medium text-fg">
              <span>{t('browser.generated_filter')}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(JSON.stringify(result.filter, null, 2));
                }}
                className="rounded border border-gray/20 px-2 py-1 text-xs text-gray hover:bg-surface-2"
              >
                {t('dsl.copy_filter')}
              </button>
            </summary>
            <div className="grid grid-cols-1 gap-4 border-t border-gray/100 px-5 py-4 lg:grid-cols-3">
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

/** Infer table columns from the first document's keys. */
function buildColumns(result: DslQueryResult | null): DataTableColumn[] {
  if (!result?.results?.length) return [];
  const first = result.results[0];
  return Object.keys(first).map((key) => ({
    key,
    label: key,
    sortable: true,
  }));
}
