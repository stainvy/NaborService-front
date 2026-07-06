import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { geoService, type GeoSuggestion } from '@/services/geo.service';
import { neighbourhoodsService } from '@/services/neighbourhoods.service';
import type { Neighbourhood, CreateNeighbourhoodPayload } from '@/types/geo';
import { NeighbourhoodMap } from './NeighbourhoodMap';

type GeoTab = 'ban' | 'browse' | 'admin';

// ─── JSON block helper ───

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-52 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs leading-relaxed text-navy">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ─── BAN Autocomplete ───

function BANTab() {
  const { t } = useTranslation('admin');
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [selected, setSelected] = useState<GeoSuggestion | null>(null);
  const [resolvedNb, setResolvedNb] = useState<Neighbourhood | null>(null);
  const [nearby, setNearby] = useState<Neighbourhood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(val: string) {
    setQ(val);
    setSelected(null);
    setResolvedNb(null);
    setNearby([]);
    if (timer.current) clearTimeout(timer.current);
    if (val.length < 3) { setSuggestions([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { const r = await geoService.autocomplete(val, 5); setSuggestions(r); } catch { /* ignore */ } finally { setLoading(false); }
    }, 300);
  }

  async function select(s: GeoSuggestion) {
    setSelected(s);
    setQ(s.label);
    setSuggestions([]);
    setError(null);
    setLoading(true);
    try {
      const nb = await geoService.resolveNeighbourhood(s.label);
      setResolvedNb(nb);
    } catch { setResolvedNb(null); }
    try {
      const n = await neighbourhoodsService.nearby(s.latitude, s.longitude, 5000);
      setNearby(n ?? []);
    } catch { setNearby([]); }
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">Autocomplétion BAN</h3>
          <input
            value={q}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Tapez une adresse (min. 3 caractères)…"
            className="w-full rounded border border-gray/30 px-3 py-2 text-sm outline-none focus:border-orange"
          />
          {loading && <p className="mt-2 text-xs text-gray">Recherche…</p>}
          {suggestions.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-auto rounded border border-gray/200">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button onClick={() => select(s)} className="w-full px-3 py-2 text-left text-sm text-navy hover:bg-orange/10">
                    {s.label} {s.postcode && <span className="text-xs text-gray">({s.postcode} {s.city})</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="rounded-lg border border-gray/200 p-4">
            <h3 className="mb-2 font-semibold text-navy">Adresse sélectionnée</h3>
            <p className="text-sm text-navy">{selected.label}</p>
            <p className="text-xs text-gray">
              GPS: {selected.latitude}, {selected.longitude}
              {selected.city && ` — ${selected.postcode} ${selected.city}`}
            </p>
            {resolvedNb && (
              <div className="mt-2 rounded bg-green-50 p-2 text-xs text-green-700">
                Quartier résolu: <strong>{resolvedNb.name}</strong> ({resolvedNb.city})
              </div>
            )}
            {resolvedNb === null && selected && !loading && (
              <p className="mt-2 text-xs text-amber-600">Aucun quartier trouvé pour cette adresse.</p>
            )}
            {selected && (
              <NeighbourhoodMap centroid={{ latitude: selected.latitude, longitude: selected.longitude }} height="200px" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {nearby.length > 0 && (
          <div className="rounded-lg border border-gray/200 p-4">
            <h3 className="mb-3 font-semibold text-navy">Quartiers proches ({nearby.length})</h3>
            <div className="max-h-64 overflow-auto">
              {nearby.map((nb) => (
                <div key={nb.pgId} className="border-b border-gray/100 py-2 text-sm text-navy">
                  <span className="font-medium">{nb.name}</span>{' '}
                  <span className="text-xs text-gray">{nb.city} {nb.zipCode}</span>
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
  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);
  const [selected, setSelected] = useState<Neighbourhood | null>(null);
  const [members, setMembers] = useState<unknown[]>([]);
  const [adjacent, setAdjacent] = useState<Neighbourhood[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await neighbourhoodsService.listAll(); setNeighbourhoods(r ?? []); } catch { /* */ } finally { setLoading(false); }
  }

  async function selectOne(nb: Neighbourhood) {
    setSelected(nb);
    setMembers([]);
    setAdjacent([]);
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        neighbourhoodsService.getMembers(nb.pgId).catch(() => []),
        neighbourhoodsService.getAdjacent(nb.pgId).catch(() => []),
      ]);
      setMembers((m as any[]) ?? []);
      setAdjacent((a as any[]) ?? []);
    } catch { /* */ }
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-gray/200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-navy">Quartiers</h3>
          <Button onClick={load} disabled={loading}>↻</Button>
        </div>
        <div className="max-h-96 overflow-auto">
          {neighbourhoods.map((nb) => (
            <button key={nb.pgId} onClick={() => selectOne(nb)} className={`block w-full px-3 py-2 text-left text-sm ${selected?.pgId === nb.pgId ? 'bg-orange/10 text-orange font-medium' : 'text-navy hover:bg-gray-50'}`}>
              {nb.name}
              <span className="ml-1 text-xs text-gray">{nb.city}</span>
              {nb.memberCount != null && <span className="ml-1 text-[10px] text-gray">({nb.memberCount})</span>}
            </button>
          ))}
          {!neighbourhoods.length && <p className="py-4 text-center text-xs text-gray">Cliquez ↻ pour charger.</p>}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-4">
        {selected && (
          <>
            <div className="rounded-lg border border-gray/200 p-4">
              <h3 className="mb-3 font-semibold text-navy">{selected.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-navy">
                <span className="text-gray">Ville:</span><span>{selected.city}</span>
                <span className="text-gray">Code postal:</span><span>{selected.zipCode}</span>
                <span className="text-gray">Pays:</span><span>{selected.country}</span>
                <span className="text-gray">ID:</span><span className="font-mono">{selected.pgId}</span>
                {selected.areaM2 != null && (<><span className="text-gray">Surface:</span><span>{selected.areaM2.toLocaleString()} m²</span></>)}
                {selected.memberCount != null && (<><span className="text-gray">Habitants:</span><span>{selected.memberCount}</span></>)}
              </div>
            </div>

            {selected.geometry && <NeighbourhoodMap geojson={selected.geometry} centroid={selected.centroid} height="250px" />}

            {adjacent.length > 0 && (
              <div className="rounded-lg border border-gray/200 p-4">
                <h3 className="mb-2 font-semibold text-navy">Adjacents ({adjacent.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {adjacent.map((a) => (
                    <span key={a.id} className="rounded bg-gray-100 px-2 py-1 text-xs text-navy">{a.name}</span>
                  ))}
                </div>
              </div>
            )}

            {members.length > 0 && (
              <details className="rounded-lg border border-gray/200 bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-navy">Habitants ({members.length})</summary>
                <div className="border-t border-gray/100 px-4 py-3">
                  <JsonBlock data={members.slice(0, 10)} />
                </div>
              </details>
            )}
          </>
        )}
        {!selected && <p className="py-8 text-center text-sm text-gray">Sélectionnez un quartier.</p>}
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
  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);
  const [selected, setSelected] = useState<Neighbourhood | null>(null);
  const [form, setForm] = useState<CreateNeighbourhoodPayload>(EMPTY_FORM);
  const [geoText, setGeoText] = useState('');
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try { const r = await neighbourhoodsService.adminList(); setNeighbourhoods(r ?? []); } catch (e: any) { setError(e?.message); } finally { setLoading(false); }
  }

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

  /** Called by NeighbourhoodMap when the user finishes drawing a polygon. */
  function handlePolygonDrawn(geojson: GeoJSON.Polygon) {
    setGeoText(JSON.stringify(geojson, null, 2));
  }

  async function save() {
    let geom: GeoJSON.Polygon;
    try { geom = JSON.parse(geoText); } catch { setError('GeoJSON invalide'); return; }
    setLoading(true); setError(null);
    try {
      const payload = { ...form, geometry: geom };
      const r = editing
        ? await neighbourhoodsService.update(selected!.pgId, payload)
        : await neighbourhoodsService.create(payload);
      setResponse(r);
      resetForm();
      await load();
    } catch (e: any) { setError(e?.response?.data?.message ?? e?.message); } finally { setLoading(false); }
  }

  async function del(pgId: string) {
    if (!confirm('Supprimer ce quartier ?')) return;
    setLoading(true); setError(null);
    try { await neighbourhoodsService.delete(pgId); setResponse({ deleted: pgId }); await load(); } catch (e: any) { setError(e?.response?.data?.message ?? e?.message); } finally { setLoading(false); }
  }

  async function checkOverlap() {
    let geom: GeoJSON.Polygon;
    try { geom = JSON.parse(geoText); } catch { setError('GeoJSON invalide'); return; }
    setLoading(true); setError(null);
    try { const r = await neighbourhoodsService.overlapCheck(geom); setResponse(r); } catch (e: any) { setError(e?.message); } finally { setLoading(false); }
  }

  async function reconcile() {
    setLoading(true); setError(null);
    try { const r = await neighbourhoodsService.reconcile(); setResponse(r); } catch (e: any) { setError(e?.message); } finally { setLoading(false); }
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
      <div className="rounded-lg border border-gray/200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-navy">Admin CRUD</h3>
          <div className="flex gap-1">
            <Button onClick={load} disabled={loading}>↻</Button>
            <Button onClick={reconcile} disabled={loading}>↺</Button>
          </div>
        </div>
        <div className="max-h-96 overflow-auto">
          {neighbourhoods.map((nb) => (
            <div key={nb.pgId} className="flex items-center justify-between border-b border-gray/100 py-2">
              <button onClick={() => selectOne(nb)} className={`text-left text-sm ${selected?.pgId === nb.pgId ? 'text-orange font-medium' : 'text-navy hover:text-orange'}`}>
                {nb.name} <span className="text-xs text-gray">{nb.city}</span>
              </button>
              <button onClick={() => del(nb.pgId)} className="text-xs text-red-500 hover:underline">del</button>
            </div>
          ))}
          {!neighbourhoods.length && <p className="py-4 text-center text-xs text-gray">Cliquez ↻</p>}
        </div>
        <button onClick={resetForm} className="mt-3 text-xs text-orange underline">+ Nouveau</button>
      </div>

      {/* Formulaire + carte */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="rounded-lg border border-gray/200 p-4">
          <h3 className="mb-3 font-semibold text-navy">{editing ? 'Modifier' : 'Créer'} un quartier</h3>
          <div className="grid grid-cols-3 gap-2">
            <input value={form.pg_id} onChange={(e) => setForm({ ...form, pg_id: e.target.value })} placeholder="ex: nb-belleville" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: Belleville" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="ex: Paris" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} placeholder="ex: 75020" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="ex: FR" className="rounded border border-gray/30 px-3 py-1.5 text-sm outline-none focus:border-orange" />
          </div>
          <label className="mt-3 block text-xs font-medium text-gray">GeoJSON Polygon</label>
          <textarea
            value={geoText}
            onChange={(e) => setGeoText(e.target.value)}
            rows={4}
            spellCheck={false}
            className="mt-1 w-full rounded border border-gray/30 bg-gray-50 px-3 py-2 font-mono text-xs leading-relaxed text-navy outline-none focus:border-orange"
            placeholder='Dessinez sur la carte ci-dessous ou collez un GeoJSON…'
          />
          <div className="mt-3 flex gap-2">
            <Button onClick={save} disabled={loading || !form.pg_id || !form.name || !geoText}>{editing ? 'Update' : 'Create'}</Button>
            <Button onClick={checkOverlap} disabled={loading || !geoText}>Check Overlap</Button>
            {editing && <Button onClick={resetForm}>Cancel</Button>}
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
        {response && (
          <details className="rounded-lg border border-gray/200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-navy">Réponse</summary>
            <div className="border-t border-gray/100 px-4 py-3"><JsonBlock data={response} /></div>
          </details>
        )}
      </div>
    </div>
  );
}

// ─── Main ───

const SUB_TABS: { key: GeoTab; label: string }[] = [
  { key: 'ban', label: 'BAN' },
  { key: 'browse', label: 'Quartiers' },
  { key: 'admin', label: 'Admin CRUD' },
];

export function GeoNeighbourhoodPanel() {
  const { t } = useTranslation('admin');
  const [tab, setTab] = useState<GeoTab>('ban');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-navy">{t('geo.title', 'Geo & Neighbourhoods')}</h2>
        <p className="mt-1 text-sm text-gray">{t('geo.subtitle', 'BAN autocomplete, neighbourhood browser, and admin CRUD.')}</p>
      </div>

      <nav className="flex gap-0 border-b border-gray/20">
        {SUB_TABS.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-orange text-orange' : 'text-gray hover:text-navy'}`}>
            {label}
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
