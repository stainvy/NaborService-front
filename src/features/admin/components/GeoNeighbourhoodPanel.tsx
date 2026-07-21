import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { GeoSuggestion } from '@/services/geo.service';
import type { Neighbourhood, CreateNeighbourhoodPayload } from '@/types/geo';
import { NeighbourhoodMap } from './NeighbourhoodMap';
import {
  useBanAutocomplete,
  useResolveNeighbourhood,
  useNearbyNeighbourhoods,
} from '../hooks/useGeoTools';
import {
  useNeighbourhoods,
  useAdminNeighbourhoods,
  useNeighbourhoodMembers,
  useAdjacentNeighbourhoods,
  useCreateNeighbourhood,
  useUpdateNeighbourhood,
  useDeleteNeighbourhood,
  useOverlapCheck,
  useReconcileNeighbourhoods,
} from '../hooks/useNeighbourhoodAdmin';

type GeoTab = 'ban' | 'browse' | 'admin';

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-52 overflow-auto rounded bg-admin-bg p-3 font-mono text-xs leading-relaxed text-admin-text">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ─── BAN Autocomplete ───

function BANTab() {
  const { t } = useTranslation('admin');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selected, setSelected] = useState<GeoSuggestion | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const { data: suggestions = [], isFetching: loadingSuggestions } = useBanAutocomplete(debouncedQ);
  const { data: resolvedNb, isLoading: resolvingNb } = useResolveNeighbourhood(selected?.label);
  const { data: nearby = [] } = useNearbyNeighbourhoods(
    selected ? { latitude: selected.latitude, longitude: selected.longitude } : undefined,
  );

  function handleChange(val: string) {
    setQ(val);
    setSelected(null);
  }

  function select(s: GeoSuggestion) {
    setSelected(s);
    setQ(s.label);
    setDebouncedQ('');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="mb-3 font-semibold text-admin-text">{t('geo.ban_title')}</h3>
          <input
            value={q}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t('geo.ban_placeholder')}
            className="w-full rounded border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
          />
          {loadingSuggestions && <p className="mt-2 text-xs text-admin-muted">{t('geo.searching')}</p>}
          {suggestions.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-auto rounded border border-admin-border">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button onClick={() => select(s)} className="w-full px-3 py-2 text-left text-sm text-admin-text hover:bg-admin-accent/10">
                    {s.label} {s.postcode && <span className="text-xs text-admin-muted">({s.postcode} {s.city})</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="rounded-lg border border-admin-border p-4">
            <h3 className="mb-2 font-semibold text-admin-text">{t('geo.selected_address')}</h3>
            <p className="text-sm text-admin-text">{selected.label}</p>
            <p className="text-xs text-admin-muted">
              GPS: {selected.latitude}, {selected.longitude}
              {selected.city && `, ${selected.postcode} ${selected.city}`}
            </p>
            {resolvedNb && (
              <div className="mt-2 rounded bg-green-50 p-2 text-xs text-green-700">
                {t('geo.resolved_neighbourhood')}: <strong>{resolvedNb.name}</strong> ({resolvedNb.city})
              </div>
            )}
            {!resolvingNb && resolvedNb === undefined && (
              <p className="mt-2 text-xs text-amber-600">{t('geo.no_neighbourhood_found')}</p>
            )}
            <NeighbourhoodMap centroid={{ latitude: selected.latitude, longitude: selected.longitude }} height="200px" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {nearby.length > 0 && (
          <div className="rounded-lg border border-admin-border p-4">
            <h3 className="mb-3 font-semibold text-admin-text">{t('geo.nearby_neighbourhoods')} ({nearby.length})</h3>
            <div className="max-h-64 overflow-auto">
              {nearby.map((nb) => (
                <div key={nb.pgId} className="border-b border-admin-border/60 py-2 text-sm text-admin-text">
                  <span className="font-medium">{nb.name}</span>{' '}
                  <span className="text-xs text-admin-muted">{nb.city} {nb.zipCode}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Neighbourhood Browser ───

function BrowseTab() {
  const { t } = useTranslation('admin');
  const [selected, setSelected] = useState<Neighbourhood | null>(null);
  const { data: neighbourhoods = [], isFetching, refetch } = useNeighbourhoods();
  const { data: members = [] } = useNeighbourhoodMembers(selected?.pgId);
  const { data: adjacent = [] } = useAdjacentNeighbourhoods(selected?.pgId);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-admin-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-admin-text">{t('geo.browse_neighbourhoods')}</h3>
          <Button tone="admin" onClick={() => refetch()} disabled={isFetching}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="max-h-96 overflow-auto">
          {neighbourhoods.map((nb) => (
            <button key={nb.pgId} onClick={() => setSelected(nb)} className={`block w-full px-3 py-2 text-left text-sm ${selected?.pgId === nb.pgId ? 'bg-admin-accent/10 text-admin-accent font-medium' : 'text-admin-text hover:bg-admin-bg'}`}>
              {nb.name}
              <span className="ml-1 text-xs text-admin-muted">{nb.city}</span>
              {nb.memberCount != null && <span className="ml-1 text-[10px] text-admin-muted">({nb.memberCount})</span>}
            </button>
          ))}
          {!neighbourhoods.length && <p className="py-4 text-center text-xs text-admin-muted">{t('geo.click_refresh')}</p>}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-4">
        {selected && (
          <>
            <div className="rounded-lg border border-admin-border p-4">
              <h3 className="mb-3 font-semibold text-admin-text">{selected.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-admin-text">
                <span className="text-admin-muted">{t('geo.city')}:</span><span>{selected.city}</span>
                <span className="text-admin-muted">{t('geo.zip')}:</span><span>{selected.zipCode}</span>
                <span className="text-admin-muted">{t('geo.country')}:</span><span>{selected.country}</span>
                <span className="text-admin-muted">{t('geo.id')}:</span><span className="font-mono">{selected.pgId}</span>
                {selected.areaM2 != null && (<><span className="text-admin-muted">{t('geo.area')}:</span><span>{selected.areaM2.toLocaleString()} m²</span></>)}
                {selected.memberCount != null && (<><span className="text-admin-muted">{t('geo.residents')}:</span><span>{selected.memberCount}</span></>)}
              </div>
            </div>

            {selected.geometry && <NeighbourhoodMap geojson={selected.geometry} centroid={selected.centroid} height="250px" />}

            {adjacent.length > 0 && (
              <div className="rounded-lg border border-admin-border p-4">
                <h3 className="mb-2 font-semibold text-admin-text">{t('geo.adjacent')} ({adjacent.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {adjacent.map((a) => (
                    <span key={a.pgId} className="rounded bg-admin-bg px-2 py-1 text-xs text-admin-text">{a.name}</span>
                  ))}
                </div>
              </div>
            )}

            {members.length > 0 && (
              <details className="rounded-lg border border-admin-border bg-admin-surface">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-admin-text">{t('geo.residents_list')} ({members.length})</summary>
                <div className="border-t border-admin-border px-4 py-3">
                  <JsonBlock data={members.slice(0, 10)} />
                </div>
              </details>
            )}
          </>
        )}
        {!selected && <p className="py-8 text-center text-sm text-admin-muted">{t('geo.select_neighbourhood')}</p>}
      </div>
    </div>
  );
}

// ─── Admin CRUD ───

const EMPTY_GEOM: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0]]],
};

const EMPTY_FORM: CreateNeighbourhoodPayload = {
  pg_id: '',
  name: '',
  city: '',
  zip_code: '',
  country: 'FR',
  geometry: EMPTY_GEOM,
};

function AdminTab() {
  const { t } = useTranslation('admin');
  const { data: neighbourhoods = [], isFetching, refetch } = useAdminNeighbourhoods();
  const [selected, setSelected] = useState<Neighbourhood | null>(null);
  const [form, setForm] = useState<CreateNeighbourhoodPayload>(EMPTY_FORM);
  const [geoText, setGeoText] = useState('');
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const createMutation = useCreateNeighbourhood();
  const updateMutation = useUpdateNeighbourhood();
  const deleteMutation = useDeleteNeighbourhood();
  const overlapMutation = useOverlapCheck();
  const reconcileMutation = useReconcileNeighbourhoods();

  const loading =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || overlapMutation.isPending || reconcileMutation.isPending;

  function selectOne(nb: Neighbourhood) {
    setSelected(nb);
    setForm({ pg_id: nb.pgId, name: nb.name, city: nb.city, zip_code: nb.zipCode, country: nb.country, geometry: nb.geometry ?? EMPTY_GEOM });
    setGeoText(nb.geometry ? JSON.stringify(nb.geometry, null, 2) : '');
    setEditing(true);
    setResponse(null);
  }

  function resetForm() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setGeoText('');
    setEditing(false);
    setResponse(null);
  }

  function handlePolygonDrawn(geojson: GeoJSON.Polygon) {
    setGeoText(JSON.stringify(geojson, null, 2));
  }

  function save() {
    let geom: GeoJSON.Polygon;
    try { geom = JSON.parse(geoText); } catch { setError(t('geo.invalid_geojson')); return; }
    setError(null);
    const payload = { ...form, geometry: geom };
    const mutation = editing
      ? updateMutation.mutateAsync({ id: selected!.pgId, payload })
      : createMutation.mutateAsync(payload);
    mutation
      .then((r) => { setResponse(r); resetForm(); })
      .catch((e: any) => setError(e?.response?.data?.message ?? e?.message));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete, {
      onSuccess: () => { setResponse({ deleted: pendingDelete }); setPendingDelete(null); },
      onError: (e: any) => { setError(e?.response?.data?.message ?? e?.message); setPendingDelete(null); },
    });
  }

  function checkOverlap() {
    let geom: GeoJSON.Polygon;
    try { geom = JSON.parse(geoText); } catch { setError(t('geo.invalid_geojson')); return; }
    setError(null);
    overlapMutation.mutate(geom, {
      onSuccess: (r) => setResponse(r),
      onError: (e: any) => setError(e?.message),
    });
  }

  function reconcile() {
    setError(null);
    reconcileMutation.mutate(undefined, {
      onSuccess: (r) => setResponse(r),
      onError: (e: any) => setError(e?.message),
    });
  }

  // GeoJSON preview from textarea
  let previewGeom: GeoJSON.Polygon | undefined;
  let previewCentroid: { latitude: number; longitude: number } | undefined;
  try {
    const g = JSON.parse(geoText) as GeoJSON.Polygon;
    if (g.type === 'Polygon' && g.coordinates?.[0]?.length) {
      previewGeom = g;
      const coords = g.coordinates[0] as [number, number][];
      const lats = coords.map(c => c[1]); const lngs = coords.map(c => c[0]);
      previewCentroid = { latitude: lats.reduce((a, b) => a + b, 0) / lats.length, longitude: lngs.reduce((a, b) => a + b, 0) / lngs.length };
    }
  } catch { /* ignore */ }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Liste */}
      <div className="rounded-lg border border-admin-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-admin-text">{t('geo.admin_crud')}</h3>
          <div className="flex gap-1">
            <Button tone="admin" onClick={() => refetch()} disabled={isFetching}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button tone="admin" onClick={reconcile} disabled={loading}><RotateCcw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="max-h-96 overflow-auto">
          {neighbourhoods.map((nb) => (
            <div key={nb.pgId} className="flex items-center justify-between border-b border-admin-border/60 py-2">
              <button onClick={() => selectOne(nb)} className={`text-left text-sm ${selected?.pgId === nb.pgId ? 'text-admin-accent font-medium' : 'text-admin-text hover:text-admin-accent'}`}>
                {nb.name} <span className="text-xs text-admin-muted">{nb.city}</span>
              </button>
              <button onClick={() => setPendingDelete(nb.pgId)} className="text-xs text-red-500 hover:underline">{t('geo.delete')}</button>
            </div>
          ))}
          {!neighbourhoods.length && <p className="py-4 text-center text-xs text-admin-muted">{t('geo.click_refresh')}</p>}
        </div>
        <button onClick={resetForm} className="mt-3 flex items-center gap-1 text-xs text-admin-accent underline">
          <Plus className="h-3 w-3" /> {t('geo.new_neighbourhood')}
        </button>
      </div>

      {/* Formulaire + carte */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="mb-3 font-semibold text-admin-text">{editing ? t('geo.edit_neighbourhood') : t('geo.create_neighbourhood')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <input value={form.pg_id} onChange={(e) => setForm({ ...form, pg_id: e.target.value })} placeholder="ex: nb-belleville" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: Belleville" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="ex: Paris" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} placeholder="ex: 75020" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="ex: FR" className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent" />
          </div>
          <label className="mt-3 block text-xs font-medium text-admin-muted">{t('geo.geojson_polygon')}</label>
          <textarea
            value={geoText}
            onChange={(e) => setGeoText(e.target.value)}
            rows={4}
            spellCheck={false}
            className="mt-1 w-full rounded border border-admin-border bg-admin-bg px-3 py-2 font-mono text-xs leading-relaxed text-admin-text outline-none focus:border-admin-accent"
            placeholder={t('geo.geojson_placeholder')}
          />
          <div className="mt-3 flex gap-2">
            <Button tone="admin" onClick={save} disabled={loading || !form.pg_id || !form.name || !geoText}>{editing ? t('geo.update') : t('geo.create')}</Button>
            <Button tone="admin" variant="secondary" onClick={checkOverlap} disabled={loading || !geoText}>{t('geo.check_overlap')}</Button>
            {editing && <Button tone="admin" variant="secondary" onClick={resetForm}>{t('geo.cancel')}</Button>}
          </div>
        </div>

        {/* Carte avec mode dessin + quartiers existants en référence */}
        <NeighbourhoodMap
          geojson={previewGeom}
          centroid={previewCentroid}
          height="350px"
          drawMode
          onPolygonDrawn={handlePolygonDrawn}
          existingPolygons={neighbourhoods
            .filter((nb) => nb.geometry)
            .map((nb) => ({ pgId: nb.pgId, name: nb.name, geojson: nb.geometry! }))}
        />

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {response != null && (
          <details className="rounded-lg border border-admin-border bg-admin-surface">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-admin-text">{t('geo.response')}</summary>
            <div className="border-t border-admin-border px-4 py-3"><JsonBlock data={response} /></div>
          </details>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        tone="admin"
        destructive
        title={t('geo.delete')}
        message={t('geo.confirm_delete_neighbourhood')}
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

// ─── Main ───

const SUB_TABS: { key: GeoTab; labelKey: string }[] = [
  { key: 'ban', labelKey: 'geo.tab_ban' },
  { key: 'browse', labelKey: 'geo.tab_browse' },
  { key: 'admin', labelKey: 'geo.tab_admin' },
];

export function GeoNeighbourhoodPanel() {
  const { t } = useTranslation('admin');
  const [tab, setTab] = useState<GeoTab>('ban');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('geo.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('geo.subtitle')}</p>
      </div>

      <nav className="flex gap-0 border-b border-admin-border">
        {SUB_TABS.map(({ key, labelKey }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-admin-accent text-admin-accent' : 'text-admin-muted hover:text-admin-text'}`}>
            {t(labelKey)}
          </button>
        ))}
      </nav>

      <div>
        {tab === 'ban' && <BANTab />}
        {tab === 'browse' && <BrowseTab />}
        {tab === 'admin' && <AdminTab />}
      </div>
    </div>
  );
}
