import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search } from 'lucide-react';
import { Button } from './Button';
import {
  useAddressAutocomplete,
  useAllNeighbourhoods,
  useDebouncedValue,
  useNearbyNeighbourhoods,
  useResolveNeighbourhood,
  type Coords,
} from '@/hooks/useNeighbourhoodPicker';
import type { Neighbourhood } from '@/types/geo';

function label(n: Neighbourhood): string {
  return [n.name, n.city, n.zipCode].filter(Boolean).join(' · ');
}

interface Props {
  value: string | undefined; // pgId sélectionné
  onChange: (pgId: string | undefined) => void;
}

// Choix du quartier par trois voies complémentaires — l'utilisateur reste
// toujours libre du choix final (le quartier de préférence prime) :
//  1. autolocalisation (recommandation),
//  2. recherche d'adresse BAN (recommandation),
//  3. liste complète (choix manuel).
export function NeighbourhoodPicker({ value, onChange }: Props) {
  const { t } = useTranslation('profile');

  const all = useAllNeighbourhoods();
  const selected = all.data?.find((n) => n.pgId === value);

  // --- Voie 1 : autolocalisation -------------------------------------------
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const nearby = useNearbyNeighbourhoods(coords);
  const nearest = nearby.data?.[0];

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('geo_not_supported');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const key =
          err.code === err.PERMISSION_DENIED
            ? 'geo_denied'
            : err.code === err.TIMEOUT
              ? 'geo_timeout'
              : 'geo_unavailable';
        setGeoError(key);
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  };

  // --- Voie 2 : recherche d'adresse BAN ------------------------------------
  const [address, setAddress] = useState('');
  const debounced = useDebouncedValue(address, 300);
  const autocomplete = useAddressAutocomplete(debounced);
  const resolve = useResolveNeighbourhood();
  const [resolved, setResolved] = useState<Neighbourhood | null>(null);

  const onPickAddress = (suggestionLabel: string) => {
    setAddress(suggestionLabel);
    setResolved(null);
    resolve.mutate(suggestionLabel, {
      onSuccess: (res) => {
        setResolved(all.data?.find((n) => n.pgId === res.neighbourhoodId) ?? null);
      },
    });
  };

  const Recommendation = ({ neighbourhood }: { neighbourhood: Neighbourhood }) => (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-navy/5 p-2">
      <span className="text-sm text-fg">
        {t('neighbourhood.recommended', { name: label(neighbourhood) })}
      </span>
      <Button type="button" onClick={() => onChange(neighbourhood.pgId)}>
        {t('neighbourhood.use')}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Sélection courante */}
      <p className="text-sm text-gray">
        {selected
          ? t('neighbourhood.current', { name: label(selected) })
          : t('neighbourhood.none_selected')}
      </p>

      {/* Voie 1 : ma position */}
      <div>
        <Button type="button" variant="secondary" onClick={requestLocation}>
          <MapPin className="mr-1 inline h-4 w-4" />
          {t('neighbourhood.use_location')}
        </Button>
        {geoError && <p className="mt-1 text-sm text-error">{t(`neighbourhood.${geoError}`)}</p>}
        {!geoError && nearby.isLoading && (
          <p className="mt-1 text-sm text-gray">{t('neighbourhood.geo_locating')}</p>
        )}
        {!geoError && nearby.isSuccess && !nearest && (
          <p className="mt-1 text-sm text-gray">{t('neighbourhood.geo_no_match')}</p>
        )}
        {!geoError && nearby.isError && (
          <p className="mt-1 text-sm text-error">{t('neighbourhood.geo_unavailable')}</p>
        )}
        {nearest && <Recommendation neighbourhood={nearest} />}
      </div>

      {/* Voie 2 : recherche d'adresse */}
      <div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-fg">{t('neighbourhood.search_address')}</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray" />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('neighbourhood.address_placeholder')}
              className="w-full rounded-md border border-gray py-2 pl-8 pr-3 focus:border-navy focus:outline-none"
            />
          </span>
        </label>

        {autocomplete.isError && (
          <p className="mt-1 text-sm text-error">{t('neighbourhood.ban_error')}</p>
        )}
        {(autocomplete.data?.length ?? 0) > 0 && (
          <ul className="mt-1 max-h-48 overflow-auto rounded-md border border-gray/40">
            {autocomplete.data!.map((s, i) => (
              <li key={`${s.label}-${i}`}>
                <button
                  type="button"
                  onClick={() => onPickAddress(s.label)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-navy/5"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {resolve.isError && (
          <p className="mt-1 text-sm text-error">{t('neighbourhood.ban_error')}</p>
        )}
        {resolved && <Recommendation neighbourhood={resolved} />}
      </div>

      {/* Voie 3 : choix manuel (prioritaire) */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-fg">{t('neighbourhood.choose_manually')}</span>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="rounded-md border border-gray px-3 py-2"
        >
          <option value="">{t('neighbourhood.none')}</option>
          {(all.data ?? []).map((n) => (
            <option key={n.pgId} value={n.pgId}>
              {label(n)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
