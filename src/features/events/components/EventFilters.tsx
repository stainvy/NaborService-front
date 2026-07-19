import { useTranslation } from 'react-i18next';
import { NeighbourhoodSelect } from '@/features/listings/components/NeighbourhoodSelect';
import { EventCategorySelect } from './EventCategorySelect';
import { EVENT_FILTER_STATUSES, type EventFilters as Filters } from '../types';

interface Props {
  value: Filters;
  onChange: (value: Filters) => void;
}

// Barre de filtres : statut, catégorie, quartier, + affichage des passés.
export function EventFilters({ value, onChange }: Props) {
  const { t } = useTranslation('events');
  const patch = (p: Partial<Filters>) => onChange({ ...value, offset: 0, ...p });
  const showPast = value.upcoming !== true;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-navy">{t('filters.status')}</span>
          <select
            value={value.status ?? ''}
            onChange={(e) => patch({ status: (e.target.value || undefined) as Filters['status'] })}
            className="rounded-md border border-gray px-3 py-2"
          >
            <option value="">{t('filters.all')}</option>
            {EVENT_FILTER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {t(`status.${st}`)}
              </option>
            ))}
          </select>
        </label>

        <EventCategorySelect
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

      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          checked={showPast}
          onChange={(e) => patch({ upcoming: e.target.checked ? undefined : true })}
        />
        {t('filters.show_past')}
      </label>
    </div>
  );
}
