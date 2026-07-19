import { useEventCategories } from '../hooks/useEventCatalog';
import { flattenCategories } from '@/types/category';

interface Props {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  label: string;
  emptyLabel: string;
}

// Menu déroulant alimenté par l'arbre des catégories d'événements.
export function EventCategorySelect({ value, onChange, label, emptyLabel }: Props) {
  const { data } = useEventCategories();
  const options = flattenCategories(data ?? []);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-navy">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="rounded-md border border-gray px-3 py-2"
      >
        <option value="">{emptyLabel}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
