import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dslService, type DslQueryResult } from '@/services/dsl.service';
import { Button } from '@/components/Button';
import { COLLECTIONS, type LifecycleFilter } from '../schemas/fieldRegistry';

function defaultQuery(collectionId: string): string {
  return `GET ${collectionId}
LIMIT 10`;
}

export function DslConsole() {
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
    // Insère une clause WHERE ou l'ajoute après une clause existante
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-navy">{t('dsl.title')}</h2>
        <p className="mt-1 text-sm text-gray">{t('dsl.subtitle')}</p>
      </div>

      {/* Sélecteur de collection */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-navy">{t('dsl.collection')}:</span>
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
            className="rounded-full border border-gray/20 bg-gray-50 px-2.5 py-1 font-mono text-[11px] text-navy transition-colors hover:border-orange hover:bg-orange/5"
            title={`${f.field} ${f.operator} ${f.value ?? ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Éditeur de requête */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-navy">{t('dsl.query_label')}</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          spellCheck={false}
          className="rounded-md border border-gray/30 bg-gray-50 px-4 py-3 font-mono text-sm leading-relaxed text-navy outline-none focus:border-orange focus:ring-1 focus:ring-orange"
          placeholder="GET contracts&#10;WHERE signed_at IS NOT NULL&#10;LIMIT 20"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray">{t('dsl.editor_hint')}</p>
          <Button onClick={handleExecute} disabled={loading || !query.trim()}>
            {loading ? t('dsl.executing') : t('dsl.execute')}
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
          <div className="rounded-lg border border-gray/200 bg-white">
            <div className="flex items-center justify-between border-b border-gray/100 px-5 py-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-navy">{t('dsl.results_title')}</h3>
                <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray">
                  {result.collection}
                </code>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {result.total ?? result.documents?.length ?? 0} {t('dsl.results_count')}
                </span>
              </div>
            </div>

            {result.documents && result.documents.length > 0 ? (
              <div className="max-h-[32rem] overflow-auto">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {result.documents.map((doc, i) => (
                      <tr
                        key={i}
                        className={`border-b border-gray/50 hover:bg-gray-50/50 ${
                          i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="w-10 select-none px-4 py-2.5 text-center text-gray">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5 font-mono leading-relaxed text-navy">
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
              <div className="px-5 py-8 text-center text-sm text-gray">
                {t('dsl.no_results')}
              </div>
            )}
          </div>

          {/* ── Section Filtre généré ── */}
          <details className="rounded-lg border border-gray/200 bg-white">
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-navy">
              {t('dsl.generated_filter')}
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

/** Remplace les champs binaires par "[BINARY]" et les champs chiffrés par "[ENCRYPTED]". */
function redactDocument(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(doc)) {
    if (key === 'data' || key === 'pdf' || key === 'qr_png' || key === 'canvas_b64') {
      out[key] = `[BINARY: ${typeof val === 'string' ? val.length + ' chars' : '—'}]`;
    } else if (key === 'content_encrypted' || key === 'iv' || key === 'auth_tag') {
      out[key] = '[ENCRYPTED]';
    } else if (key === 'email' || key === 'signed_ip' || key === 'full_name') {
      out[key] = typeof val === 'string' ? val.slice(0, 3) + '***' : '[REDACTED]';
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      out[key] = redactDocument(val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function MiniBlock({ label, json, value }: { label: string; json?: unknown; value?: unknown }) {
  const display = json !== undefined ? JSON.stringify(json, null, 2) : String(value ?? '—');
  return (
    <div className="rounded border border-gray/20 bg-white p-3">
      <p className="mb-1 text-xs font-medium text-gray">{label}</p>
      <pre className="max-h-40 overflow-auto font-mono text-xs text-navy">{display}</pre>
    </div>
  );
}
