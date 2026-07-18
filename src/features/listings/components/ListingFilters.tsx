import { useTranslation } from 'react-i18next';
import { CategorySelect } from './CategorySelect';
import { NeighbourhoodSelect } from './NeighbourhoodSelect';
import {
  LISTING_STATUSES,
  LISTING_TYPES,
  type ListingFilters as Filters,
} from '../types';

interface Props {
  value: Filters;
  onChange: (value: Filters) => void;
}

// Barre de filtres : type, statut, catégorie (id), quartier.
export function ListingFilters({ value, onChange }: Props) {
  const { t } = useTranslation('listings');
  const patch = (p: Partial<Filters>) => onChange({ ...value, offset: 0, ...p });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-navy">{t('filters.type')}</span>
        <select
          value={value.type ?? ''}
          onChange={(e) => patch({ type: (e.target.value || undefined) as Filters['type'] })}
          className="rounded-md border border-gray px-3 py-2"
        >
          <option value="">{t('filters.all')}</option>
          {LISTING_TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`type.${ty}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-navy">{t('filters.status')}</span>
        <select
          value={value.status ?? ''}
          onChange={(e) => {
            const status = (e.target.value || undefined) as Filters['status'];
            patch({ status });
          }}
          className="rounded-md border border-gray px-3 py-2"
        >
          <option value="">{t('filters.all_statuses')}</option>
          {LISTING_STATUSES.map((st) => (
            <option key={st} value={st}>
              {t(`status.${st}`)}
            </option>
          ))}
        </select>
      </label>

      <CategorySelect
        label={t('filters.category')}
        emptyLabel={t('filters.all')}
        value={value.category}
        onChange={(category) => patch({ category })}
      />

      <NeighbourhoodSelect
        label={t('filters.neighbourhood')}
        emptyLabel={t('filters.all')}
        value={value.neighbourhood}
        onChange={(neighbourhood) => patch({ neighbourhood })}
      />
    </div>
  );
}
