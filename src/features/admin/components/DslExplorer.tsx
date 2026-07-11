import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Lock } from 'lucide-react';
import {
  COLLECTIONS,
  FIELD_TYPE_COLORS,
  type CollectionDef,
  type FieldDef,
} from '../schemas/fieldRegistry';

export function DslExplorer() {
  const { t } = useTranslation('admin');
  const [selected, setSelected] = useState<CollectionDef>(COLLECTIONS[0]);

  const col = selected;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('dsl.explorer_title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('dsl.explorer_subtitle')}</p>
      </div>

      {/* Grille des collections */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {COLLECTIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c)}
            className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              selected.id === c.id
                ? 'border-admin-accent bg-admin-accent/5'
                : 'border-admin-border hover:border-admin-muted'
            }`}
          >
            <p className="font-medium text-admin-text">{c.label}</p>
            <p className="mt-0.5 font-mono text-xs text-admin-muted">{c.id}</p>
            <p className="mt-1 text-xs text-admin-muted">
              {c.fields.length} {t('dsl.fields_count')}
            </p>
          </button>
        ))}
      </div>

      {/* Détail collection */}
      <div className="rounded-lg border border-admin-border bg-admin-surface">
        <div className="border-b border-admin-border px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-admin-text">{col.label}</h3>
            <code className="rounded bg-admin-bg px-2 py-0.5 font-mono text-xs text-admin-muted">
              {col.id}
            </code>
          </div>
          <p className="mt-1 text-sm text-admin-muted">{col.description}</p>
          <p className="mt-2 text-xs text-admin-muted">
            {t('dsl.pg_ref')}: <code className="font-mono text-admin-text">{col.pgRefField}</code>
          </p>
        </div>

        {/* Champs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg">
                <th className="px-5 py-2 font-medium text-admin-text">{t('dsl.field')}</th>
                <th className="px-5 py-2 font-medium text-admin-text">{t('dsl.type')}</th>
                <th className="px-5 py-2 font-medium text-admin-text">{t('dsl.indexed_short')}</th>
                <th className="px-5 py-2 font-medium text-admin-text">{t('dsl.sensitive')}</th>
                <th className="px-5 py-2 font-medium text-admin-text">{t('dsl.note')}</th>
              </tr>
            </thead>
            <tbody>
              {col.fields.map((f) => (
                <FieldRow key={f.name} field={f} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Filtres lifecycle */}
        <div className="border-t border-admin-border px-5 py-4">
          <h4 className="mb-2 text-sm font-medium text-admin-text">{t('dsl.lifecycle_filters')}</h4>
          <div className="flex flex-wrap gap-2">
            {col.lifecycleFilters.map((f, i) => (
              <span
                key={i}
                className="inline-block rounded-full border border-admin-border bg-admin-bg px-3 py-1 font-mono text-xs text-admin-text"
              >
                {f.label}: {f.field} {f.operator} {f.value ?? ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ field }: { field: FieldDef }) {
  return (
    <tr className="border-b border-admin-border/60 hover:bg-admin-bg/50">
      <td className="px-5 py-2">
        <code className="font-mono text-xs text-admin-text">{field.name}</code>
        {field.lifecycle && (
          <span className="ml-2 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
            {field.lifecycle}
          </span>
        )}
      </td>
      <td className="px-5 py-2">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${FIELD_TYPE_COLORS[field.type]}`}>
          {field.type}
        </span>
      </td>
      <td className="px-5 py-2">
        {field.indexed ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <Zap className="h-3 w-3" /> {field.name.split('.').pop()}
          </span>
        ) : (
          <span className="text-xs text-admin-muted">—</span>
        )}
      </td>
      <td className="px-5 py-2">
        {field.sensitive ? (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-red-600">
            <Lock className="h-3 w-3" />
          </span>
        ) : (
          <span className="text-xs text-admin-muted">—</span>
        )}
      </td>
      <td className="max-w-xs truncate px-5 py-2 text-xs text-admin-muted">
        {field.description ?? '—'}
      </td>
    </tr>
  );
}
