import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
        <h2 className="text-lg font-bold text-navy">{t('dsl.explorer_title')}</h2>
        <p className="mt-1 text-sm text-gray">{t('dsl.explorer_subtitle')}</p>
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
                ? 'border-orange bg-orange/5'
                : 'border-gray/20 hover:border-gray/40'
            }`}
          >
            <p className="font-medium text-navy">{c.label}</p>
            <p className="mt-0.5 font-mono text-xs text-gray">{c.id}</p>
            <p className="mt-1 text-xs text-gray">
              {c.fields.length} {t('dsl.fields_count')}
            </p>
          </button>
        ))}
      </div>

      {/* Détail collection */}
      <div className="rounded-lg border border-gray/20 bg-white">
        <div className="border-b border-gray/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-navy">{col.label}</h3>
            <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray">
              {col.id}
            </code>
          </div>
          <p className="mt-1 text-sm text-gray">{col.description}</p>
          <p className="mt-2 text-xs text-gray">
            {t('dsl.pg_ref')}: <code className="font-mono text-navy">{col.pgRefField}</code>
          </p>
        </div>

        {/* Champs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray/20 bg-gray-50">
                <th className="px-5 py-2 font-medium text-navy">{t('dsl.field')}</th>
                <th className="px-5 py-2 font-medium text-navy">{t('dsl.type')}</th>
                <th className="px-5 py-2 font-medium text-navy">{t('dsl.indexed_short')}</th>
                <th className="px-5 py-2 font-medium text-navy">{t('dsl.sensitive')}</th>
                <th className="px-5 py-2 font-medium text-navy">{t('dsl.note')}</th>
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
        <div className="border-t border-gray/20 px-5 py-4">
          <h4 className="mb-2 text-sm font-medium text-navy">{t('dsl.lifecycle_filters')}</h4>
          <div className="flex flex-wrap gap-2">
            {col.lifecycleFilters.map((f, i) => (
              <span
                key={i}
                className="inline-block rounded-full border border-gray/20 bg-gray-50 px-3 py-1 font-mono text-xs text-navy"
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
    <tr className="border-b border-gray/10 hover:bg-gray-50/50">
      <td className="px-5 py-2">
        <code className="font-mono text-xs text-navy">{field.name}</code>
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
          <span className="text-xs font-medium text-green-600">⚡ {field.name.split('.').pop()}</span>
        ) : (
          <span className="text-xs text-gray">—</span>
        )}
      </td>
      <td className="px-5 py-2">
        {field.sensitive ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">🔒</span>
        ) : (
          <span className="text-xs text-gray">—</span>
        )}
      </td>
      <td className="max-w-xs truncate px-5 py-2 text-xs text-gray">
        {field.description ?? '—'}
      </td>
    </tr>
  );
}
