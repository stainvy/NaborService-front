import { useNeighbourhoods } from '../hooks/useCatalog';
import type { Neighbourhood } from '@/types/geo';

interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
  emptyLabel: string;
}

// Le back identifie les quartiers par `pgId` (ex. "nb-downtown"), pas un UUID.
function neighbourhoodLabel(n: Neighbourhood): string {
  return [n.name, n.city, n.zipCode].filter(Boolean).join(' · ');
}

// Sélecteur de quartier alimenté par GET /neighbourhoods (types/geo, admin+public).
export function NeighbourhoodSelect({ value, onChange, label, emptyLabel }: Props) {
  const { data } = useNeighbourhoods();

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-navy">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="rounded-md border border-gray px-3 py-2"
      >
        <option value="">{emptyLabel}</option>
        {(data ?? []).map((n) => (
          <option key={n.pgId} value={n.pgId}>
            {neighbourhoodLabel(n)}
          </option>
        ))}
      </select>
    </label>
  );
}
